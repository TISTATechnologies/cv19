import React, {
  useLayoutEffect, useEffect, useState, useRef, useMemo,
} from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';

import { initMap, drawMap, getAllMapData } from '../d3/map/map';
import '../d3/map/map.css';
import {
  fetchAllCountyData, fetchEmployeeData, fetchGeo, fetchAidData,
} from '../util/fetch';

const showAssociateView = (window.CONFIG.viewAssociates || process.env.REACT_APP_VIEW_ASSOCIATES) === '1';

const mapNames = {
  confirmed: {
    short: 'Confirmed Cases',
    long: 'Total Confirmed Cases by County',
  },
  ratio: {
    short: 'Confirmed per 100,000',
    long: 'Confirmed Cases per 100,000 People',
  },
  associateImpact: {
    short: 'Associate Impact',
    long: 'Associate Pandemic Impact Map',
  },
  aid: {
    short: 'TISTA Aid',
    long: "TISTA's Aid Locations",
  },
};

const UsaMap = ({ data }) => {
  const [myMap, setMyMap] = useState('confirmed');
  const [heat, setHeat] = useState([]);
  const [aid, setAid] = useState([]);
  const [countyMap, setCountyMap] = useState({ features: [] });
  const [stateMap, setStateMap] = useState({ features: [] });
  const [metroMap, setMetroMap] = useState({ features: [] });
  const [isGeoSaved, setIsGeoSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isHeatSaved, setIsHeatSaved] = useState(false);
  const [isAidSaved, setIsAidSaved] = useState(false);
  const sectionEl = useRef(null);

  const readiedMap = useMemo(() => {
    const getMapReady = () => {
      // console.log('%c Ready Map', 'color: lime');

      const width = sectionEl.current.clientWidth || 200;
      const height = Math.max(width * (1 / 2), 200);
      drawMap(width, height, data, heat, myMap, aid);
    };
    return getMapReady;
  }, [data, heat, myMap, aid]);

  useEffect(() => {
    const f = async () => {
      const { data: geoData } = await fetchGeo();
      setCountyMap(geoData[0]);
      setStateMap(geoData[1]);
      setMetroMap(geoData[2]);
      setIsGeoSaved(true);
    };
    if (!isGeoSaved) {
      f();
    }
  }, [isGeoSaved]);

  useEffect(() => {
    const f = async () => {
      const { data: eData } = await fetchEmployeeData();
      const { data: heatData } = await fetchAllCountyData();
      if (heatData && heatData.length) {
        const finalHeat = getAllMapData(heatData, eData);
        setHeat(finalHeat);
        // console.log('%c Got Heat Data', 'color: yellow');
      }
    };
    if (!isHeatSaved && isGeoSaved) {
      setIsHeatSaved(true);
      f();
    }
  }, [isGeoSaved, isHeatSaved]);

  useEffect(() => {
    function createAidData(arr) {
      return arr.map((d) => {
        const aidAmount = Math.max(d.masks + d.meals, d.pendingMasks + d.pendingMeals);
        return {
          long: d.long,
          lat: d.lat,
          masks: d.masks || 0,
          meals: d.meals || 0,
          pendingMasks: d.pendingMasks || 0,
          pendingMeals: d.pendingMeals || 0,
          aid: aidAmount,
          name: d.name,
          county: d.county,
          state: d.state,
          r: 8,
        };
      });
    }

    const f = async () => {
      const { data: aidData } = await fetchAidData();
      if (aidData && aidData.length) {
        setAid(createAidData(aidData));
        // console.log('%c Got Aid Data', 'color: yellow');
      }
    };
    if (!isAidSaved) {
      setIsAidSaved(true);
      f();
    }
  }, [isAidSaved]);

  useLayoutEffect(() => {
    if (isGeoSaved && isAidSaved) {
      if (!initialized) {
        initMap({
          width: 200,
          height: 500,
          countyMap,
          stateMap,
          aidData: aid,
          metroMap,
        });
        setInitialized(true);
      } else {
        readiedMap();
      }
    }
    window.addEventListener('resize', readiedMap);
    return () => window.removeEventListener('resize', readiedMap);
  }, [
    aid,
    countyMap,
    data,
    heat,
    initialized,
    isAidSaved,
    isGeoSaved,
    myMap,
    readiedMap,
    stateMap,
    metroMap,
  ]);

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
        <FormControlLabel value="confirmed" control={<Radio />} label={mapNames.confirmed.short} />
        <FormControlLabel value="ratio" control={<Radio />} label={mapNames.ratio.short} />
        {showAssociateView ? (
          <FormControlLabel
            value="associateImpact"
            control={<Radio />}
            label={mapNames.associateImpact.short}
          />
        ) : null}
        <FormControlLabel value="aid" control={<Radio />} label={mapNames.aid.short} />
      </RadioGroup>
    </FormControl>
  );

  return (
    <Card variant="outlined">
      <CardHeader title={`${mapNames[myMap].long}`} subheader={action} />
      <CardContent>
        <section ref={sectionEl} style={{ width: '100%', height: '100%' }} />
      </CardContent>
    </Card>
  );
};

export default UsaMap;
