import React, {
  useState, useLayoutEffect, useMemo, useRef,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';

import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import SwapHorizontalCircleIcon from '@material-ui/icons/SwapHorizontalCircle';

import HistoricOptions from './HistoricOptions';
import HistoricSlider from './HistoricSlider';
import { init, draw } from '../d3/line/historic';

const useStyles = makeStyles(() => ({
  tooltip: { fontSize: '0.8em', backgroundColor: '#222' },
}));

const HistoricRates = ({ location, historic, level }) => {
  const classes = useStyles();
  const levelIsCounty = level === 'county';
  const [showing, setShowing] = useState(0);
  const [timeSpan, setTimeSpan] = useState(90);
  const [initialized, setInitialized] = useState(false);
  const [selection, setSelection] = useState({
    trend2: false,
    trend7: true,
    trend14: true,
    trend30: false,
    value: false,
    hospitalized: true,
  });
  const sectionEl = useRef(null);

  const toggleShowing = () => {
    const s = showing + 1;
    setShowing(s % 2);
  };

  const [countyLevelLocation, stateLevelLocation] = location;

  const currentLocationName = location[showing] && levelIsCounty
    ? location[showing].name
    : countyLevelLocation.name;
  let otherLocationName = currentLocationName;
  if (showing === 0) {
    otherLocationName = stateLevelLocation ? stateLevelLocation.name : '';
  } else {
    otherLocationName = countyLevelLocation.name;
  }

  const action = levelIsCounty ? (
    <IconButton color="secondary" size="small" onClick={toggleShowing}>
      <Tooltip
        enterTouchDelay={100}
        arrow
        title={`Show Trends for ${otherLocationName}`}
        classes={{ tooltip: classes.tooltip }}
        interactive
        placement="left"
      >
        <SwapHorizontalCircleIcon />
      </Tooltip>
    </IconButton>
  ) : null;

  const formControl = (
    <Grid container>
      <Grid item xs={12} sm={6}>
        <HistoricOptions
          selection={selection}
          setSelection={setSelection}
          showHosp={levelIsCounty && showing === 1}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <HistoricSlider value={timeSpan} changeValue={setTimeSpan} />
      </Grid>
    </Grid>
  );

  const ready = useMemo(() => {
    const getLinesReady = () => {
      let show = showing;
      if (level !== 'county') {
        show = 0;
      }
      const width = sectionEl.current.clientWidth || 900;
      const height = 100;
      // console.log(`%c Ready LINES (${width}x${height})`, 'color: lime');
      draw(width, height, historic[show], selection, (levelIsCounty && showing === 1), timeSpan);
    };
    return getLinesReady;
  }, [showing, level, historic, selection, levelIsCounty, timeSpan]);

  useLayoutEffect(() => {
    if (!initialized) {
      init(200, 100);
      setInitialized(true);
    } else {
      ready();
    }
    window.addEventListener('resize', ready);
    return () => window.removeEventListener('resize', ready);
  }, [initialized, ready]);

  return (
    <Card variant="outlined">
      <CardHeader
        title={`Trends for ${level !== 'usa' ? currentLocationName : 'USA'}`}
        titleTypographyProps={{
          className: classes.title,
        }}
        action={action}
        subheader={formControl}
      />
      <CardContent>
        <div id="historic" ref={sectionEl} style={{ width: '100%' }} />
      </CardContent>
    </Card>
  );
};

export default HistoricRates;
