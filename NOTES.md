Main datasets with Covid-19:
* https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports
* http://covidtracking.com/api
* https://usafacts.org/visualizations/coronavirus-covid-19-spread-map/
* https://github.com/nytimes/covid-19-data
* https://covid-19.datasettes.com/ -> https://github.com/simonw/covid-19-datasette


USA - States and territories official list:
* https://www.loc.gov/law/help/guide/states.php
* https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States
* https://en.wikipedia.org/wiki/Associated_state


-------------------------------------------------------------------------------

FISP: https://en.wikipedia.org/wiki/FIPS_county_code
Counties: https://en.wikipedia.org/wiki/County_(United_States)
Census 2011: https://www.census.gov/library/publications/2011/compendia/usa-counties-2011.html

Maps:
https://coronavirus.jhu.edu/us-map

ZIP to FIPS
* https://www.huduser.gov/portal/datasets/usps_crosswalk.html (COUNTY-FIPS, 2019q4)
* https://wonder.cdc.gov/wonder/sci_data/codes/fips/type_txt/cntyxref.asp
* https://github.com/bgruber/zip2fips
* https://catalog.data.gov/dataset?tags=zip-code
* https://www.zip-codes.com/zip-code-api.asp
* zip code list (by city NO COUNTIES): http://federalgovernmentzipcodes.us/download.html
    - https://github.com/davglass/zipcodes
* ZIP with COUNTY: https://www.huduser.gov/portal/datasets/usps_crosswalk.html
    - Direct link will be: https://www.huduser.gov/portal/datasets/usps/ZIP_COUNTY_032020.xlsx
    


US Countie statistics:
* https://www.usgs.gov/faqs/how-many-counties-are-united-states?qt-news_science_products=0#qt-news_science_products
* https://en.wikipedia.org/wiki/List_of_United_States_counties_and_county_equivalents

US States       : 51
US Counties     : 3142 counties and 100 dounty-territories      // on 2018
US STATES FIPS  : https://www.mcc.co.mercer.pa.us/dps/state_fips_code_listing.htm
US COUNTIES FIPS: https://www.census.gov/geographies/reference-files/2017/demo/popest/2017-fips.html


# Other datasources with Covid-19 data
* https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series
* https://covidtracking.com/data
* https://github.com/NovelCOVID/API
* https://github.com/javieraviles/covidAPI
* https://covid19tracker.health.ny.gov/views/NYS-COVID19-Tracker/NYSDOHCOVID-19Tracker-Map?%3Aembed=yes&%3Atoolbar=no&%3Atabs=n


Fields:
* Cases: 422,369
* Deaths: 14,463
* Active: 385,719
* Recovered: 22,187
* Critical 9,225
* Today cases: 22,034
* Today deathe: 1,622




# Steps of the resuests from a WebApp
1. Look into the API for FIPS by zip:
http://18.232.212.26:3000/zip_to_fips?zip=eq.30543
http://18.232.212.26:3000/zip_to_fips?zip=eq.68335
http://18.232.212.26:3000/zip_to_fips?zip=eq.22121
...
2. 
http://18.232.212.26:3000/covid_data_stat?zip=eq.46723
http://18.232.212.26:3000/covid_data_stat?fips=in.(22001,22003)



------------
Temporary add executive news into the DB:
INSERT INTO covid_info_link(country_id, state_id, note, url)
  VALUES('US', 'MD', 'State of Emergency declared', 'https://governor.maryland.gov/wp-content/uploads/2020/03/Proclamation-COVID-19.pdf');
INSERT INTO covid_info_link(country_id, state_id, note, url)
  VALUES('US', 'MD', 'Gatherings, Stay at Home Order', 'https://governor.maryland.gov/wp-content/uploads/2020/03/Gatherings-FOURTH-AMENDED-3.30.20.pdf');
