import React from 'react';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import ListItemText from '@material-ui/core/ListItemText';

const getOptionLabel = (o) => o.zip || '20850';
const getOptionSelected = (o, v) => o.zip === v.zip;
const renderOption = (o) => <ListItemText primary={o.zip} secondary={`${o.name}, ${o.state_id}`} />;

const filterOptions = createFilterOptions({
  matchFrom: 'start',
  trim: true,
  limit: 10,
});

// "options" in this case means availiable choices for the dropdown

const ZipInput = ({
  textFieldParams, options = [], onChange, onInputChange, inputValue,
}) => (
  <Autocomplete
    onChange={onChange}
    onInputChange={onInputChange}
    inputValue={inputValue}
    autoComplete
    autoHighlight
    forcePopupIcon={false}
    filterOptions={filterOptions}
    id="zip-search-input"
    options={[...options]}
    getOptionLabel={getOptionLabel}
    getOptionSelected={getOptionSelected}
    disableClearable
    renderOption={renderOption}
    renderInput={(params) => <TextField {...params} {...textFieldParams} variant="outlined" />}
  />
);

export default ZipInput;
