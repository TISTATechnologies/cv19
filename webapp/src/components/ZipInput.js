import React from 'react';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import { fade, makeStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';
import ListItemText from '@material-ui/core/ListItemText';
import { findFirst } from '../util/arrays';

const getOptionLabel = (o) => o.zip;
const getOptionSelected = (o, v) => o.zip === v.zip;

const isCounty = (c) => !c.fips.toUpperCase().includes('US');
const isMetro = (c) => c.fips.toUpperCase().includes('US');

const filterOptions = createFilterOptions({
  matchFrom: 'start',
  trim: true,
  limit: 10,
});

const useStyles = makeStyles((theme) => ({
  metro: {
    // backgroundColor: theme.palette.secondary.main,
    margin: '0 -1em',
    padding: '1em',
    color: fade(theme.palette.warning.light, 0.95),
  },
  metroSecondary: {
    color: fade(theme.palette.warning.main, 0.9),
  },
}));

// "options" in this case means availiable choices for the dropdown
// In order to remove extra copies of the Metro Areas, we filter them out, remove dups, and add
// them back in. We try to add back the one that matches the qurery best.

const ZipInput = ({
  textFieldParams, options = [], onChange, onInputChange, inputValue,
}) => {
  const countyOptions = options.filter(isCounty);
  const metroOptions = options.filter(isMetro);
  const myMetro = findFirst(metroOptions, inputValue);
  if (myMetro) {
    countyOptions.unshift(myMetro);
  }
  const classes = useStyles();
  const renderOption = (o) => (
    <ListItemText
      primary={o.zip}
      secondary={`${o.name}, ${o.state_id}`}
      classes={{
        root: o.fips.includes('US') ? classes.metro : '',
        secondary: o.fips.includes('US') ? classes.metroSecondary : '',
      }}
    />
  );
  return (
    <Autocomplete
      debug
      onChange={onChange}
      onInputChange={onInputChange}
      inputValue={inputValue}
      autoComplete
      autoHighlight
      forcePopupIcon={false}
      filterOptions={filterOptions}
      id="zip-search-input"
      options={countyOptions}
      getOptionLabel={getOptionLabel}
      getOptionSelected={getOptionSelected}
      disableClearable
      renderOption={renderOption}
      renderInput={(params) => <TextField {...params} {...textFieldParams} variant="outlined" />}
    />
  );
};

export default ZipInput;
