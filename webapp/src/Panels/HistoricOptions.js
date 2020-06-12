import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { schemeSet2 } from "d3";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Checkbox from "@material-ui/core/Checkbox";

const useStyles = makeStyles((theme) => ({
  root: {
    // position: 'absolute',
    // left: `${theme.spacing(1)}px`,
  },
  formControl: {
    margin: theme.spacing(0),
  },
  checkRoot0: {
    color: schemeSet2[0],
    "&$checked": {
      color: schemeSet2[0],
    },
  },
  checkRoot1: {
    color: schemeSet2[1],
    "&$checked": {
      color: schemeSet2[1],
    },
  },
  checkRoot2: {
    color: schemeSet2[2],
    "&$checked": {
      color: schemeSet2[2],
    },
  },
  checkRoot3: {
    color: schemeSet2[3],
    "&$checked": {
      color: schemeSet2[3],
    },
  },
  checked: {},
}));

const CheckboxesGroup = ({ selection, setSelection }) => {
  const classes = useStyles();

  const handleChange = (event) => {
    setSelection({ ...selection, [event.target.name]: event.target.checked });
  };

  const { trend2, trend7, trend30, value } = selection;

  return (
    <div className={classes.root}>
      <FormControl component="fieldset" className={classes.formControl}>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={trend2}
                onChange={handleChange}
                name="trend2"
                classes={{ root: classes.checkRoot0, checked: classes.checked }}
              />
            }
            label="2D"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={trend7}
                onChange={handleChange}
                name="trend7"
                classes={{ root: classes.checkRoot1, checked: classes.checked }}
              />
            }
            label="7D"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={trend30}
                onChange={handleChange}
                name="trend30"
                classes={{ root: classes.checkRoot2, checked: classes.checked }}
              />
            }
            label="1M"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={value}
                onChange={handleChange}
                name="value"
                classes={{ root: classes.checkRoot3, checked: classes.checked }}
              />
            }
            label="Case Count"
          />
        </FormGroup>
      </FormControl>
    </div>
  );
};

export default CheckboxesGroup;
