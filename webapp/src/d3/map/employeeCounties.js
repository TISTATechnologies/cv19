let employeeData = null;
if (process.env.REACT_APP_VIEW_ASSOCIATES === '1' )
  employeeData = [
    { fips: "11001", location_name: "District of Columbia, DC", count: 0 },
  ];
export default employeeData;
