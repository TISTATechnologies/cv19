import React, {
  useLayoutEffect,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";

import { initMap, drawMap, getAllMapData } from "../d3/map/map.js";
import "../d3/map/map.css";
import { fetchAllCountyData, fetchEmployeeData } from "../util/fetch";

const associateView = process.env.REACT_APP_VIEW_ASSOCIATES === "1";

const mapNames = {
  confirmed: {
    short: "Confirmed Cases",
    long: "Total Confirmed Cases by County",
  },
  ratio: {
    short: "Confirmed per 100,000",
    long: "Confirmed Cases per 100,000 People",
  },
  associateImpact: {
    short: "Associate Impact",
    long: "Associate Pandemic Impact Map",
  },
  aid: {
    short: "TISTA Aid",
    long: "TISTA's Aid Locations",
  },
};

const UsaMap = ({ data }) => {
  // const [localCountyHeat, setLocalCountyHeat] = useLocalStorage(
  //   "countyHeat",
  //   []
  // );
  const [myMap, setMyMap] = useState("confirmed");
  const [heat, setHeat] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [isHeatSaved, setIsHeatSaved] = useState(false);
  const sectionEl = useRef(null);

  const readiedMap = useMemo(() => {
    const getMapReady = () => {
      console.log(`%c Ready Map`, "color: lime");

      const width = sectionEl.current.clientWidth || 200;
      const height = width * (1 / 2);
      drawMap(width, height, data, heat, myMap);
    };
    return getMapReady;
  }, [data, heat, myMap]);

  useEffect(() => {
    console.log(`%cUSAMAP render`, "color: orange");
  });

  useEffect(() => {
    const f = async () => {
      let { data: eData } = await fetchEmployeeData();
      let { data: heatData } = await fetchAllCountyData();
      if (heatData && heatData.length) {
        const finalHeat = getAllMapData(heatData, eData);
        setHeat(finalHeat);
        // setLocalCountyHeat(heat);
        console.log(`%c Got Heat Data`, "color: yellow");
      }
    };
    if (!isHeatSaved) {
      setIsHeatSaved(true);
      f();
    }
  }, [isHeatSaved]);

  useLayoutEffect(() => {
    if (!initialized) {
      initMap(200, 500);
      setInitialized(true);
    } else {
      readiedMap();
    }
    window.addEventListener("resize", readiedMap);
    return () => window.removeEventListener("resize", readiedMap);
  }, [data, heat, initialized, myMap, readiedMap]);

  const handleRadioChange = ({ target }) => {
    setMyMap(target.value);
  };

  const action = (
    <FormControl>
      <RadioGroup
        row
        aria-label="map selection"
        name="map"
        value={myMap}
        onChange={handleRadioChange}
      >
        <FormControlLabel
          value="confirmed"
          control={<Radio />}
          label={mapNames.confirmed.short}
        />
        <FormControlLabel
          value="ratio"
          control={<Radio />}
          label={mapNames.ratio.short}
        />
        {associateView ? (
          <FormControlLabel
            value="associateImpact"
            control={<Radio />}
            label={mapNames.associateImpact.short}
          />
        ) : null}
        <FormControlLabel
          value="aid"
          control={<Radio />}
          label={mapNames.aid.short}
        />
      </RadioGroup>
    </FormControl>
  );

  return (
    <Card variant="outlined">
      <CardHeader title={`${mapNames[myMap].long}`} subheader={action} />
      <CardContent>
        <section
          ref={sectionEl}
          style={{ width: "100%", height: "100%" }}
        ></section>
      </CardContent>
    </Card>
  );
};

export default UsaMap;
