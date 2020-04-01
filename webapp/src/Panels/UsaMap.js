import React, { useLayoutEffect, useEffect, useState, useRef } from "react";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";

import { initMap, drawMap } from "../d3/map/map.js";
import "../d3/map/map.css";
import { fetchAllCountyData } from "../util/fetch";
import useLocalStorage from "../util/useLocalStorage";

const UsaMap = ({ data }) => {
  const [localCountyHeat, setLocalCountyHeat] = useLocalStorage(
    "countyHeat",
    []
  );
  const [heat, setHeat] = useState(localCountyHeat);
  const [initialized, setInitialized] = useState(false);
  const sectionEl = useRef(null);

  useEffect(() => {
    setLocalCountyHeat(heat);
  }, [heat, setLocalCountyHeat]);

  useEffect(() => {
    const f = async () => {
      let { data: heatData } = await fetchAllCountyData();
      if (heatData && heatData.length) {
        setHeat(heatData);
      }
    };
    f();
  }, []);

  useLayoutEffect(() => {
    const readyMap = () => {
      const width = sectionEl.current.clientWidth || 200;
      const height = 400;
      drawMap(width, height, data, heat);
    };
    if (!initialized) {
      initMap(200, 400);
      setInitialized(true);
    }
    readyMap();
    window.addEventListener("resize", readyMap);
    return () => window.removeEventListener("resize", readyMap);
  }, [data, heat]);

  return (
    <Card variant="outlined">
      <CardHeader title={`Map of Confirmed Cases`} />
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
