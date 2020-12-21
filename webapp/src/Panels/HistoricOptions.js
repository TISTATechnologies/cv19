import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { schemeSet2 } from 'd3';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import Visible from '../components/Visible';

const useStyles = makeStyles((theme) => ({
  root: {},
  formControl: {
    margin: theme.spacing(0),
  },
  checkRoot0: {
    color: schemeSet2[0],
    '&$checked': {
      color: schemeSet2[0],
    },
  },
  checkRoot1: {
    color: schemeSet2[1],
    '&$checked': {
      color: schemeSet2[1],
    },
  },
  checkRoot2: {
    color: schemeSet2[2],
    '&$checked': {
      color: schemeSet2[2],
    },
  },
  checkRoot3: {
    color: schemeSet2[3],
    '&$checked': {
      color: schemeSet2[3],
    },
  },
  checkRoot4: {
    color: schemeSet2[4],
    '&$checked': {
      color: schemeSet2[4],
    },
  },
  checkRoot5: {
    color: schemeSet2[5],
    '&$checked': {
      color: schemeSet2[5],
    },
  },
  checked: {},
  tooltip: {
    backgroundColor: 'rgba(16,16,16,0.9)',
    boarderRadius: '10px',
    boxShadow: '3px 3px rgba(33, 33, 33, 0.3)',
    fontSize: '12px',
    maxWidth: '50vw',
  },
  arrow: {
    color: 'rgba(16,16,16,0.9)',
  },
}));

const ArrowTooltip = ({ children, ...props }) => {
  const classes = useStyles();
  return (
    <Tooltip
      enterTouchDelay={100}
      arrow
      classes={{
        tooltip: classes.tooltip,
        arrow: classes.arrow,
      }}
      {...props}
    >
      {children}
    </Tooltip>
  );
};

const CheckboxesGroup = ({ selection, setSelection, showHosp }) => {
  const classes = useStyles();

  const handleChange = (event) => {
    setSelection({ ...selection, [event.target.name]: event.target.checked });
  };

  const {
    trend2, trend7, trend14, trend30, value, hospitalized,
  } = selection;

  const modHospitalized = showHosp && hospitalized;

  return (
    <div className={classes.root}>
      <FormControl component="fieldset" className={classes.formControl}>
        <FormGroup row>
          <ArrowTooltip title="How quickly the active case count increases or decreases, measured over two days.">
            <FormControlLabel
              control={(
                <Checkbox
                  checked={trend2}
                  onChange={handleChange}
                  name="trend2"
                  classes={{ root: classes.checkRoot0, checked: classes.checked }}
                />
              )}
              label="2D"
            />
          </ArrowTooltip>

          <ArrowTooltip title="How quickly the active case count increases or decreases, measured over seven days.">
            <FormControlLabel
              control={(
                <Checkbox
                  checked={trend7}
                  onChange={handleChange}
                  name="trend7"
                  classes={{ root: classes.checkRoot1, checked: classes.checked }}
                />
              )}
              label="7D"
            />
          </ArrowTooltip>

          <ArrowTooltip title="How quickly the active case count increases or decreases, measured over fourteen days.">
            <FormControlLabel
              control={(
                <Checkbox
                  checked={trend14}
                  onChange={handleChange}
                  name="trend14"
                  classes={{ root: classes.checkRoot4, checked: classes.checked }}
                />
              )}
              label="14D"
            />
          </ArrowTooltip>

          <ArrowTooltip title="How quickly the active case count increases or decreases, measured over one month.">
            <FormControlLabel
              control={(
                <Checkbox
                  checked={trend30}
                  onChange={handleChange}
                  name="trend30"
                  classes={{ root: classes.checkRoot2, checked: classes.checked }}
                />
              )}
              label="1M"
            />
          </ArrowTooltip>

          <ArrowTooltip title="Count of active cases.">
            <FormControlLabel
              control={(
                <Checkbox
                  checked={value}
                  onChange={handleChange}
                  name="value"
                  classes={{ root: classes.checkRoot3, checked: classes.checked }}
                />
              )}
              label="Case Count"
            />
          </ArrowTooltip>
          <Visible condition={showHosp}>
            <ArrowTooltip title="Count of current hospitalizations.">
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={modHospitalized}
                    onChange={handleChange}
                    name="hospitalized"
                    classes={{ root: classes.checkRoot5, checked: classes.checked }}
                  />
                )}
                label="Hospt."
              />
            </ArrowTooltip>
          </Visible>
        </FormGroup>
      </FormControl>
    </div>
  );
};

export default CheckboxesGroup;
