import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import Slider from '@material-ui/core/Slider';

const useStyles = makeStyles((theme) => ({
  root: {},
  formControl: {
    margin: theme.spacing(0),
    width: '100%',
  },
  slider: {},
}));

const HistoricSlider = ({ value, changeValue }) => {
  const classes = useStyles();

  function valuetext(val) {
    return `${val} days`;
  }

  function handleChange(e, newValue) {
    const t = Number.parseInt(newValue, 10);
    if (!Number.isNaN(t)) changeValue(t);
  }

  const marks = [
    {
      value: 30,
      label: '1M',
    },
    {
      value: 60,
      label: '2M',
    },
    {
      value: 90,
      label: '3M',
    },
    {
      value: 182,
      label: '6M',
    },
    {
      value: 273,
      label: '9M',
    },
    {
      value: 365,
      label: '1Y',
    },
  ];
  return (
    <div className={classes.root}>
      <FormControl component="fieldset" className={classes.formControl}>
        <FormGroup row>
          <Slider
            color="secondary"
            defaultValue={value}
            aria-labelledby="slider-label"
            getAriaValueText={valuetext}
            valueLabelDisplay="off"
            step={10}
            marks={marks}
            min={30}
            max={365}
            onChange={handleChange}
            name="day-slider"
            classes={{ root: classes.slider }}
          />
        </FormGroup>
      </FormControl>
    </div>
  );
};

export default HistoricSlider;
