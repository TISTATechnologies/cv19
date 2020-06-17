import React, {
  useState, useLayoutEffect, useMemo, useRef,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';

import HistoricOptions from './HistoricOptions';
import { init, draw } from '../d3/line/historic';

const useStyles = makeStyles(() => ({}));

const HistoricRates = ({ county, historic, level }) => {
  const [initialized, setInitialized] = useState(false);
  const [selection, setSelection] = useState({
    trend2: true,
    trend7: false,
    trend30: false,
    value: false,
  });
  const sectionEl = useRef(null);

  const action = <HistoricOptions selection={selection} setSelection={setSelection} />;

  const ready = useMemo(() => {
    const getLinesReady = () => {
      const width = sectionEl.current.clientWidth || 900;
      const height = 100;
      // console.log(`%c Ready LINES (${width}x${height})`, 'color: lime');
      draw(width, height, historic, selection);
    };
    return getLinesReady;
  }, [historic, selection]);

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

  const classes = useStyles();
  return (
    <Card variant="outlined">
      <CardHeader
        title={`Active Case Velocity for ${level !== 'usa' ? county.name : 'USA'}`}
        titleTypographyProps={{
          className: classes.title,
        }}
        subheader={action}
      />
      <CardContent>
        <div id="historic" ref={sectionEl} style={{ width: '100%' }} />
      </CardContent>
    </Card>
  );
};

export default HistoricRates;
