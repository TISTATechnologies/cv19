import * as d3 from 'd3';

const projection = d3.geoAlbersUsa();
// Create GeoPath function that uses built-in D3 functionality to turn
// lat/lon coordinates into screen coordinates
const geoPath = d3.geoPath().projection(projection);
let globalScale = 1;

let countyGeo = [];
let stateGeo = [];

const bigFormat = new Intl.NumberFormat('en', {});

const bivarColors = [
  '#ffffff',
  '#e4acac',
  '#c85a5a',
  '#b0d5df',
  '#ad9ea5',
  '#985356',
  '#64acbe',
  '#627f8c',
  '#574249',
];

let confirmedColor = d3
  .scaleSequentialLog(d3.interpolateYlOrRd)
  .domain([10, 1000])
  .unknown('#999')
  .nice();

let ratioColor = d3
  .scaleSequentialLog(d3.interpolateBuPu)
  .domain([10, 1000])
  .unknown('#999')
  .nice();

const assocCountScale = d3.scaleThreshold().domain([20, 50]).range(d3.range(3));

const ratioImpactScale = d3.scaleThreshold().domain([500, 1000]).range(d3.range(3));

const associateImpactColor = (value) => {
  if (!value || !value[0] || !value[1]) return '#999';
  const [a, b] = value;
  const left = ratioImpactScale(b);
  const right = assocCountScale(a);
  return bivarColors[left + right * 3];
};

const squareScale = d3.scaleSqrt().domain([100, 10000]).range([0.8, 2]).clamp(true);

let aidSimulation;

// LEGEND
function betterLegend({ div, colorScale, scaleValues = 'linear' }) {
  let data;
  let steps;
  let textTransform;
  if (scaleValues === 'log') {
    steps = Math.ceil(Math.log10(d3.max(colorScale.domain()))) || 4;
    data = Array(steps)
      .fill(0)
      .map((x, i) => 10 ** (i + 1));
    textTransform = (d) => `${d3.format('~s')(d / 10)} - ${d3.format('~s')(d)}`;
  } else {
    steps = Math.ceil(d3.max(colorScale.domain()) / 10) || 4;
    data = Array(steps + 1)
      .fill(0)
      .map((x, i) => 10 * i);
    textTransform = (d) => `${d3.format('~s')(d)}`;
  }

  const checkContrast = (color) => {
    const hsl = d3.hsl(color);
    const L = hsl.l;
    if (L > 0.5) return '#000000';
    return '#ffffff';
  };
  const t = d3.transition().duration(1000).ease(d3.easeLinear);

  div
    .selectAll('div')
    .data(data, (d, i) => i)
    .join(
      (enter) => enter
        .append('div')
        .attr('background', '#999')
        .style('color', '#999')
        .attr('class', 'legend-square')
        .call((me) => me
          .transition(t)
          .style('background', (d) => colorScale(d))
          .style('color', (d) => checkContrast(colorScale(d)))),
      (update) => update.call((me) => me
        .transition(t)
        .style('background', (d) => colorScale(d))
        .style('color', (d) => checkContrast(colorScale(d)))),
    )
    .text(textTransform)
    .transition(t)
    .delay((d, i) => i * 100);
}

function aidLegend({ div }) {
  const legendSize = '20px';
  const strokeSize = '2px';
  div.selectAll('div').remove();
  div
    .append('div')
    .style('width', legendSize)
    .style('height', legendSize)
    .style('border', `${strokeSize} solid #ffff33`)
    .style('border-radius', legendSize)
    .style('background', '#ffff33')
    .style('margin', '2.5px')
    .append('div')
    .attr('class', 'leggy')
    .text('Masks Distributed');
  div
    .append('div')
    .style('width', legendSize)
    .style('height', legendSize)
    .style('border', `${strokeSize} solid #ffff33`)
    .style('border-radius', legendSize)
    .style('background', 'transparent')
    .style('margin', '2.5px')
    .append('div')
    .attr('class', 'leggy')
    .text('Masks Committed');
  div
    .append('div')
    .style('width', legendSize)
    .style('height', legendSize)
    .style('border', `${strokeSize} solid #00acc4`)
    .style('background', '#00acc4')
    .style('margin', '2.5px')
    .append('div')
    .attr('class', 'leggy')
    .text('Meals Served');
  div
    .append('div')
    .style('width', legendSize)
    .style('height', legendSize)
    .style('border', `${strokeSize} solid #00acc4`)
    .style('background', 'transparent')
    .style('margin', '2.5px')
    .append('div')
    .attr('class', 'leggy')
    .text('Meals Committed');
}

function bivarLegend({ div }) {
  const k = 25;
  const data = d3.cross(d3.range(3), d3.range(3), (i, j) => ({
    x: i * k,
    y: (2 - j) * k,
    fill: bivarColors[j * 3 + i],
  }));
  // console.dir(data);
  div
    .selectAll('div')
    .data(data)
    .join('div')
    .style('top', (d) => `-${d.x}px`)
    .style('left', (d) => `${d.y}px`)
    .style('width', `${k}px`)
    .style('height', `${k}px`)
    .style('background', (d) => d.fill)
    .style('position', 'absolute')
    .text('');

  div.append('div').text('Associates').attr('class', 'assoc');
  div.append('div').text('Cases/100k').attr('class', 'cases');
}

function buildTooltipText({
  population, properties, confirmed, deaths, count, active,
}) {
  let string = '';
  if (!Number.isNaN(Number.parseInt(population, 10))) {
    string += `<div class='tooltip-population'>Pop: ${bigFormat.format(population)}</div>`;
  } else {
    string += 'NO DATA';
  }
  if (!Number.isNaN(Number.parseInt(count, 10))) {
    string += `<hr/><div>TISTA Assoc.: ${bigFormat.format(count)}</div>`;
    // string += `<div>RATIO.: ${bigFormat.format(associateImpact)}</div>`;
  }
  if (!Number.isNaN(Number.parseInt(confirmed, 10))) {
    string += `<hr/><div class='tooltip-confirmed'>Confirmed: ${bigFormat.format(confirmed)}</div>`;
    if (confirmed / population) {
      const cRate = Math.ceil((confirmed / population) * 1e5);
      string += `<div>per 100k: ${bigFormat.format(cRate)}</div>`;
    }
  }
  if (!Number.isNaN(Number.parseInt(deaths, 10))) {
    string += `<hr/><div class='tooltip-deaths'>Deaths: ${bigFormat.format(deaths)}</div>`;
    if (deaths / population) {
      const dRate = Math.ceil((deaths / population) * 1e5);
      string += `<div>per 100k: ${bigFormat.format(dRate)}</div>`;
    }
  }
  if (!Number.isNaN(Number.parseInt(active, 10))) {
    string += `<hr/><div class='tooltip-active'>Active: ${bigFormat.format(active)}</div>`;
    if (active / population) {
      const aRate = Math.ceil((active / population) * 1e5);
      string += `<div>per 100k: ${bigFormat.format(aRate)}</div>`;
    }
  }
  return `<div><strong>${properties.NAME}</strong></div>${string}`;
}

function buildTooltipAidText({
  name, masks, meals, pendingMasks, pendingMeals, county, state,
}) {
  let string = '';
  if (masks && !Number.isNaN(Number.parseInt(masks, 10))) {
    string += `<div class='tooltip-masks'>Masks Distributed: ${bigFormat.format(masks)}</div>`;
  }
  if (pendingMasks && !Number.isNaN(Number.parseInt(pendingMasks, 10))) {
    string += `<div class='tooltip-masks'>Masks (Committed): ${bigFormat.format(
      pendingMasks,
    )}</div>`;
  }
  if (meals && !Number.isNaN(Number.parseInt(meals, 10))) {
    string += `<div class='tooltip-meals'>Meals Served: ${bigFormat.format(meals)}</div>`;
  }
  if (pendingMeals && !Number.isNaN(Number.parseInt(pendingMeals, 10))) {
    string += `<div class='tooltip-meals'>Meals (Committed): ${bigFormat.format(
      pendingMeals,
    )}</div>`;
  }
  return `<div><strong>${name}</strong></div><div>${county}, ${state}</div>${string}`;
}

function hideToolTip() {
  d3.selectAll('.tooltip').style('visibility', 'hidden').style('opacity', '0');
}

function showToolTip(d) {
  const t = d3.select('.tooltip');
  const x = d3.event.pageX;
  const ttWidth = 150;
  const xAdjust = x + ttWidth + 25 < window.innerWidth ? x + 25 : x - 150;
  t.html(buildTooltipText(d));
  t.style('top', `${d3.event.pageY - 15}px`)
    .style('left', `${xAdjust}px`)
    .style('visibility', 'visible')
    .style('opacity', '1');
}

function showAidToolTip(d) {
  const t = d3.select('.tooltip-aid');
  const x = d3.event.pageX;
  const ttWidth = 200;
  const xAdjust = x + ttWidth + 25 < window.innerWidth ? x + 25 : x - 200;
  t.html(buildTooltipAidText(d));
  t.style('top', `${d3.event.pageY - 15}px`)
    .style('left', `${xAdjust}px`)
    .style('visibility', 'visible')
    .style('opacity', '1');
}
// For aidMap pins
function drawCircles({ group, scale = 1, data }) {
  const circleFillColor = (d) => {
    if (d.masks) return '#ffff33';
    return 'transparent';
  };
  const squareFillColor = (d) => {
    if (d.meals) return '#00acc4';
    return 'transparent';
  };
  const circleStrokeColor = (d) => {
    if (d.pendingMasks && !d.masks) return '#ffff33';
    // return "#990";
    return 'transparent';
  };
  const squareStrokeColor = (d) => {
    if (d.pendingMeals && !d.meals) return '#00acc4';
    // return "#005562";
    return 'transparent';
  };
  const iconSize = 8;
  const squareSize = Math.sqrt(2) * iconSize;

  group
    .selectAll('circle')
    .data(data)
    .join('circle')
    .attr('class', 'pin')
    .on('mouseout', hideToolTip)
    .on('mousemove', showAidToolTip)
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .attr('r', (d) => (squareScale(d.aid) * iconSize) / scale)
    .attr('fill', (d) => circleFillColor(d))
    // .attr("fill-opacity", 0.8)
    .attr('stroke', (d) => circleStrokeColor(d))
    // .attr("stroke-opacity", 0.9)
    .attr('stroke-width', 2 / scale)
    // .style('filter', 'url(#shadow)')
    .style('visibility', (d) => (d.masks + d.pendingMasks > 0 ? 'visible' : 'hidden'));
  group
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('class', 'pin')
    .on('mouseout', hideToolTip)
    .on('mousemove', showAidToolTip)
    .attr('x', (d) => d.x - (squareScale(d.aid) * (squareSize / 2)) / scale)
    .attr('y', (d) => d.y - (squareScale(d.aid) * (squareSize / 2)) / scale)
    .attr('width', (d) => (squareScale(d.aid) * squareSize) / scale)
    .attr('height', (d) => (squareScale(d.aid) * squareSize) / scale)
    .attr('fill', (d) => squareFillColor(d))
    // .attr("fill-opacity", 0.8)
    .attr('stroke', (d) => squareStrokeColor(d))
    // .attr("stroke-opacity", 0.9)
    .attr('stroke-width', 2 / scale)
    // .style('filter', 'url(#shadow)')
    .style('visibility', (d) => (d.meals + d.pendingMeals > 0 ? 'visible' : 'hidden'));
}

function joinTables(lookupTable, mainTable, lookupKey, mainKey, select) {
  const l = lookupTable.length;
  const m = mainTable.length;
  const lookupIndex = [];
  const output = [];
  for (let i = 0; i < l; i += 1) {
    // loop through l items
    const row = lookupTable[i];
    lookupIndex[row[lookupKey]] = row; // create an index for lookup table
  }
  for (let j = 0; j < m; j += 1) {
    // loop through m items
    const y = mainTable[j];
    const x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
    output.push(select(y, x)); // select only the columns you need
  }
  return output;
}

function initMap(width = 950, height = 300, countyMap, stateMap, aidData) {
  console.log('%cINIT MAP ', 'color: limegreen');

  countyGeo = countyMap.features.map((x) => ({
    ...x,
    fips: x.properties.STATE + x.properties.COUNTY,
  }));
  stateGeo = stateMap.features.map((x) => ({
    ...x,
    fips: x.properties.STATE,
  }));
  const svg = d3
    .selectAll('section')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'd3Map');

  d3.selectAll('section')
    .append('div')
    .attr('class', 'legend-holder')
    .append('div')
    .attr('class', 'd3Legend');

  d3.selectAll('.legend-holder').append('div').attr('class', 'd3BivLegend');

  d3.selectAll('.legend-holder').append('div').attr('class', 'd3AidLegend');
  // .attr("style", "position: absolute")

  svg
    .append('defs')
    .append('filter')
    .attr('id', 'shadow')
    .append('feDropShadow')
    .attr('dx', '0.1')
    .attr('dy', '0.1')
    .attr('y', '-50%')
    .attr('x', '-50%')
    .attr('width', '200%')
    .attr('height', '200%')
    .attr('filterUnits', 'userSpaceOnUse')
    .attr('stdDeviation', '0.0')
    .attr('flood-color', '#222')
    .attr('flood-opacity', '0.5');

  const g = svg.append('g');
  g.append('g').attr('class', 'counties');
  const states = g.append('g').attr('class', 'states');
  const circles = g.append('g').attr('class', 'circles');
  d3.select('section')
    .append('div')
    .attr('class', 'tooltip')
    .attr('y', 30)
    .style('visibility', 'hidden')
    .style('opacity', '0');

  d3.select('section')
    .append('div')
    .attr('class', 'tooltip tooltip-aid')
    .attr('y', 30)
    .style('visibility', 'hidden')
    .style('opacity', '0');

  states
    .selectAll('path')
    .data(stateGeo)
    .join('path')
    .attr('d', geoPath)
    .attr('fill', 'none')
    .attr('stroke', '#222');

  aidSimulation = d3
    .forceSimulation(aidData)
    .on('tick', () => {
      drawCircles({
        group: circles,
        scale: globalScale,
        data: aidData,
      });
    })
    .force(
      'force-collide',
      d3.forceCollide().radius((d) => (2 + squareScale(d.aid) * 8) / globalScale),
    )
    .force('force-x', d3.forceX((d) => projection([d.long, d.lat])[0]).strength(0.2))
    .force('force-y', d3.forceY((d) => projection([d.long, d.lat])[1]).strength(0.2));
}

function getAllMapData(countyHeat, EmpCounties) {
  // console.log('%cGet ALL MAP DATA', 'color: orange');
  // console.log(`%c${!!EmpCounties}`, 'color: orange');
  let finalCounty;
  if (countyHeat.length) {
    finalCounty = joinTables(countyHeat, countyGeo, 'fips', 'fips', (g, h) => ({
      ...g,
      confirmed: h !== undefined ? h.confirmed : undefined,
      active: h !== undefined ? h.active : undefined,
      recovered: h !== undefined ? h.recovered : undefined,
      deaths: h !== undefined ? h.deaths : undefined,
      population: h !== undefined ? h.population : undefined,
      geo_lat: h !== undefined ? h.geo_lat : undefined,
      geo_long: h !== undefined ? h.geo_long : undefined,
      ratio: h !== undefined ? (h.confirmed / h.population) * 1e5 : undefined,
    }));
    if (EmpCounties) {
      finalCounty = joinTables(EmpCounties, finalCounty, 'fips', 'fips', (g, h) => ({
        ...g,
        count: h !== undefined ? h.value : undefined,
        associateRatio: h !== undefined ? (h.value * g.ratio) / 1e3 : undefined,
      }));
    }
  } else {
    finalCounty = countyGeo;
  }
  return finalCounty;
}

function drawMap(width = 950, height = 300, location = {}, countyHeat, myMap, aidData) {
  // console.log(`%cDRAW MAP: ${myMap} `, 'color: magenta');
  // Create SVG
  const svg = d3.selectAll('.d3Map').attr('width', width).attr('height', height);

  d3.select('.d3Legend').attr('width', width);

  const g = svg.select('g');
  const counties = g.select('.counties');
  g.select('.states');
  const circles = g.select('.circles');
  d3.select('.tooltip');
  d3.select('.tooltip-aid');

  const confirmed = countyHeat.map((x) => x.confirmed || 1); // log domain can't be 0
  const confirmedExtend = d3.extent(confirmed);
  confirmedColor = confirmedColor.domain(confirmedExtend);

  const ratio = countyHeat.map((x) => x.ratio || 1); // log domain can't be 0
  const ratioExtend = d3.extent(ratio);
  ratioColor = ratioColor.domain(ratioExtend);

  // Append aidMap placeholder g element to the SVG
  // g will contain geometry elements
  let currentColorFunction = confirmedColor;
  let scaleValues;
  switch (myMap) {
    case 'ratio':
      currentColorFunction = ratioColor;
      scaleValues = 'log';
      break;
    case 'associateImpact':
      currentColorFunction = confirmedColor;
      scaleValues = 'linear';
      break;
    default:
      currentColorFunction = confirmedColor;
      scaleValues = 'log';
  }

  const colorFunction = (d) => {
    switch (myMap) {
      case 'ratio':
        return ratioColor(d.ratio);
      case 'associateImpact':
        return associateImpactColor([d.count, d.ratio]);
      case 'confirmed':
      default:
        return confirmedColor(d.confirmed);
    }
  };

  function zoomed() {
    const { transform } = d3.event;
    globalScale = transform.k;
    g.attr('transform', transform);
    g.attr('stroke-width', 1 / transform.k);
    if (myMap === 'aid') {
      aidSimulation.force('force-collide').initialize(aidData);
      aidSimulation.force('force-x').initialize(aidData);
      aidSimulation.force('force-y').initialize(aidData);
      aidSimulation.alpha(0.5).alphaTarget(0.3).restart();
    } else {
      aidSimulation.stop();
      circles.selectAll('circle').remove();
      circles.selectAll('rect').remove();
    }
  }

  const t = d3.transition().duration(400);

  counties
    .selectAll('path')
    .data(countyHeat, (d) => d.fips)
    .join('path')
    .attr('class', (d) => `fips${d.fips} county`)
    .on('mouseout', hideToolTip)
    .on('mousemove', showToolTip)
    .attr('stroke-linejoin', 'round')
    .attr('d', geoPath)
    .transition(t)
    .delay((d, i) => (i % 10) * 50)
    .attr('fill', colorFunction)
    .attr('opacity', '0.9')
    .attr('stroke', '#444')
    .attr('stroke-opacity', 0.2);

  const zoom = d3.zoom().scaleExtent([0.8, 40]).on('zoom', zoomed);

  function drawLocation(drawnLoc) {
    counties
      .select(`.fips${drawnLoc.fips}`)
      .attr('opacity', '1')
      .attr('stroke', '#00BCD4')
      .attr('stroke-width', 0.7)
      .attr('stroke-opacity', 1)
      .attr('class', 'active');
  }
  function zoomToUsa() {
    const moveX = Math.min(0, width / 2);
    const moveY = Math.min(0, height / 2);

    svg
      .transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(moveX, moveY).scale(1));
  }
  function toLocation(newLocation) {
    // // console.log(`%cTransition? ${location.location_name}`, "color: lime");
    const [x, y] = projection([newLocation.geo_long, newLocation.geo_lat]);
    const scale = 10;
    // const scale = projection.scale()
    const offsetX = x * scale;
    const offsetY = y * scale;
    const moveX = Math.min(0, width / 2 - offsetX);
    const moveY = Math.min(0, height / 2 - offsetY);
    svg
      .transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(moveX, moveY).scale(scale));
  }

  svg.call(zoom);
  if (location.geo_lat) {
    toLocation(location);
    if (myMap !== 'aid') drawLocation(location);
  } else {
    zoomToUsa();
  }

  if (myMap !== 'associateImpact' && myMap !== 'aid') {
    d3.select('.d3BivLegend').style('visibility', 'hidden');
    d3.select('.d3Legend').style('visibility', 'visible');
    d3.select('.d3AidLegend').style('visibility', 'hidden');
    betterLegend({
      div: d3.select('.d3Legend'),
      width,
      height: 20,
      colorScale: currentColorFunction,
      scaleValues,
    });
  } else if (myMap === 'associateImpact') {
    d3.select('.d3BivLegend').style('visibility', 'visible');
    d3.select('.d3Legend').style('visibility', 'hidden');
    d3.select('.d3AidLegend').style('visibility', 'hidden');
    bivarLegend({
      div: d3.select('.d3BivLegend'),
    });
  } else {
    d3.select('.d3BivLegend').style('visibility', 'hidden');
    d3.select('.d3Legend').style('visibility', 'hidden');
    d3.select('.d3AidLegend').style('visibility', 'visible');
    aidLegend({ div: d3.select('.d3AidLegend') });
  }
}

export { drawMap, initMap, getAllMapData };
