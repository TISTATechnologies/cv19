import CountyMap from "./gz_2010_us_050_00_20m.json";
import StateMap from "./gz_2010_us_040_00_20m.json";
import * as d3 from "d3";

const countyGeo = CountyMap.features.map(x => ({
  ...x,
  fips: x.properties.STATE + x.properties.COUNTY
}));
const stateGeo = StateMap.features.map(x => ({
  ...x,
  fips: x.properties.STATE
}));

function showToolTip(d, i) {
  const t = d3.select(".tooltip");
  let { fips, confirmed, deaths, location_name, population } = d;
  let rate = "NO DATA";
  const x = d3.event.pageX
  const ttWidth = 150;
  const xAdjust = x + ttWidth + 25 < window.innerWidth ? x + 25 : x - 150;
  if (typeof population !== "number") population = "NO DATA";
  if (typeof confirmed !== "number") confirmed = "NO DATA";
  if (typeof deaths !== "number") deaths = "NO DATA";
  if (confirmed / population) rate = Math.ceil((confirmed / population) * 1e5);
  t.html(`<div><strong>${d.properties.NAME}</strong></div>
    <div>Confirmed: ${confirmed}</div>
    <div>Deaths: ${deaths}</div>
    `);
  t.style("top", `${d3.event.pageY - 15}px`)
    .style("left", `${xAdjust}px`)
    .style("visibility", "visible")
    .style("opacity", "1");
  console.dir();
}


function hideToolTip() {
  const t = d3
    .select(".tooltip")
    .style("visibility", "hidden")
    .style("opacity", "0");
}

function joinTables(lookupTable, mainTable, lookupKey, mainKey, select) {
  var l = lookupTable.length,
    m = mainTable.length,
    lookupIndex = [],
    output = [];
  for (var i = 0; i < l; i++) {
    // loop through l items
    var row = lookupTable[i];
    lookupIndex[row[lookupKey]] = row; // create an index for lookup table
  }
  for (var j = 0; j < m; j++) {
    // loop through m items
    var y = mainTable[j];
    var x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
    output.push(select(y, x)); // select only the columns you need
  }
  return output;
}

const projection = d3.geoAlbersUsa();

function initMap(width = 950, height = 300) {
  console.log(`%cINIT MAP `, 'color: limegreen');
  const svg = d3
    .selectAll("section")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "d3Map")
    .attr("style", "background-color:steelblue");

  const legend = d3
    .selectAll("section")
    .append("div")
    .attr("class", "d3Legend")
    // .attr("style", "position: absolute")

  const g = svg.append("g");
  const counties = g.append("g").attr("class", "counties");
  const states = g.append("g").attr("class", "states");
  const tooltip = d3
    .select("section")
    .append("div")
    .attr("class", "tooltip")
    .attr("y", 30)
    .style("visibility", "hidden")
    .style("opacity", "0");
}

function drawMap(width = 950, height = 300, location = {}, countyHeat) {
  // Create SVG
  let finalCounty;

  const svg = d3
    .selectAll(".d3Map")
    .attr("width", width)
    .attr("height", height);

  const legend = d3.select(".d3Legend").attr("width", width);

  const g = svg.select("g");
  const counties = g.select(".counties");
  const states = g.select(".states");
  const tooltip = d3.select(".tooltip");

  let color = d3
    .scaleSequentialLog(d3.interpolateYlOrRd)
    .domain([10, 1000])
    .unknown("#ccc")
    .nice();

  if (countyHeat.length) {
    const confirmed = countyHeat.map(x => x.confirmed || 1); // log domain can't be 0
    const confirmedExtend = d3.extent(confirmed);
    color = color.domain(confirmedExtend);
    finalCounty = joinTables(countyHeat, countyGeo, "fips", "fips", (g, h) => ({
      ...g,
      confirmed: h !== undefined ? h.confirmed : null,
      active: h !== undefined ? h.active : null,
      recovered: h !== undefined ? h.recovered : null,
      deaths: h !== undefined ? h.deaths : null,
      population: h !== undefined ? h.population : null
    }));
  } else {
    finalCounty = countyGeo;
  }

  // Create GeoPath function that uses built-in D3 functionality to turn
  // lat/lon coordinates into screen coordinates
  const geoPath = d3.geoPath().projection(projection);
  // Append empty placeholder g element to the SVG
  // g will contain geometry elements

  // Classic D3... Select non-existent elements, bind the data, append the elements, and apply attributes
  counties
    .selectAll("path")
    .data(finalCounty)
    .join("path")
    .attr("fill", d => color(d.confirmed))
    .attr("opacity", "0.9")
    .attr("stroke", "slategray")
    .attr("d", geoPath)
    .attr("stroke-opacity", 0.2)
    .attr("stroke-linejoin", "round")
    .attr("class", d => `fips${d.fips} county`)
    .on("mouseout", hideToolTip)
    .on("mousemove", showToolTip);

  states
    .selectAll("path")
    .data(stateGeo)
    .join("path")
    .attr("d", geoPath)
    .attr("fill", "none")
    .attr("stroke", "#666");

  const zoom = d3
    .zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);

  function drawLocation(location) {
    counties
      .select(`.fips${location.fips}`)
      .attr("opacity", "1")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 1);
  }

  function toLocation(location) {
    // console.log(`%cTransition? ${location.location_name}`, "color: lime");
    const [x, y] = projection([location.geo_long, location.geo_lat]);
    const scale = 10;
    // const scale = projection.scale()
    const offsetX = x * scale;
    const offsetY = y * scale;
    const moveX = Math.min(0, width / 2 - offsetX);
    const moveY = Math.min(0, height / 2 - offsetY);
    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity.translate(moveX, moveY).scale(scale)
      );
  }

  function zoomed() {
    const { transform } = d3.event;
    g.attr("transform", transform);
    g.attr("stroke-width", 1 / transform.k);
  }

  svg.call(zoom);
  if (location.geo_lat) {
    toLocation(location);
    drawLocation(location);
  }

  betterLegend({
    div: d3.select(".d3Legend"),
    width,
    height: 20,
    colorScale: color
  });
}

// LEGEND
function createLegend({ div, width, height, colorScale }) {
  const margin = { top: 5, right: 5, bottom: 5, left: 5 };
  const barHeight = 20;
  const liarsData = [width];

  div
    .selectAll("h6")
    .data(liarsData)
    .join("h6")
    .text("Cases per county")
    .attr("class", "legend-header")
    .attr("style", `transform: translateY(-130px)`);

  const svg = div.select("svg").attr("width", width);
  svg.append("defs");
  const defs = svg.select("defs");

  const axisScale = d3
    .scaleLog()
    .domain(colorScale.domain())
    .range([margin.left, width - margin.right]);

  const linearGradient = defs
    .append("linearGradient")
    .attr("id", "linear-gradient");

  linearGradient
    .selectAll("stop")
    .data(
      colorScale.ticks().map((t, i, n) => ({
        offset: `${(100 * i) / n.length}%`,
        color: colorScale(t)
      }))
    )
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  svg
    .selectAll("g")
    .data(liarsData)
    .join("g")
    .attr("class", `x-axis`)
    .attr("transform", `translate(0,${margin.top + barHeight * 3})`)
    .call(
      d3
        .axisBottom()
        .scale(axisScale)
        .tickSize(-barHeight)
        .ticks(4, ".1s")
    );

  svg
    .selectAll("rect")
    .data(liarsData)
    .join("rect")
    .attr(
      "transform",
      `translate(${margin.left},${margin.top + barHeight * 2})`
    )
    .attr("width", d => d - margin.right - margin.left)
    .attr("height", barHeight)
    .style("fill", "url(#linear-gradient)");
}

function betterLegend({ div, width, height, colorScale }) {
  div.selectAll("div")
  .data([1,10,1e3,1e4,1e5])
  .join("div")
  .attr('class', 'legend-square')
  .style('background', d => colorScale(d))
  // .style('transform', (d,i) => `translateX(${i*(width/5)}px)`)
  .text(d => `${d3.format('.1s')(d)} - ${d3.format('.1s')(d*10)}`)
}

export {drawMap, initMap};
