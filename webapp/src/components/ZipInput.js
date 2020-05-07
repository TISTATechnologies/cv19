import React, { useState } from "react";
import Autocomplete, {
  createFilterOptions,
} from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import SearchIcon from "@material-ui/icons/Search";
import InputAdornment from "@material-ui/core/InputAdornment";
import ListItemText from "@material-ui/core/ListItemText";

const defaultOptions = [
  // { fips:"24031", zip: "20850", name: "Montgomery", state_id: "MD" },
];
const getOptionLabel = (o) => o.zip || '20850';
const getOptionSelected = (o, v) => o.zip === v.zip;
const renderOption = (o) => (
  <ListItemText primary={o.zip} secondary={`${o.name}, ${o.state_id}`} />
);

const filterOptions = createFilterOptions({
  matchFrom: "start",
  trim: true,
  limit: 10,
});

const ZipInput = ({ textFieldParams, options = defaultOptions, ...props }) => {
  return (
    <Autocomplete
      {...props}
      autoComplete
      autoHighlight
      forcePopupIcon={false}
      filterOptions={filterOptions}
      id="zip-search-input"
      options={[...options, ...defaultOptions]}
      getOptionLabel={getOptionLabel}
      getOptionSelected={getOptionSelected}
      disableClearable
      renderOption={renderOption}
      renderInput={(params) => (
        <TextField {...params} {...textFieldParams} variant="outlined" />
      )}
    />
  );
};

export default ZipInput;
