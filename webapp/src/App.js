/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {
  Suspense, useState, useEffect, useMemo, useCallback,
} from 'react';
import { fade, makeStyles } from '@material-ui/core/styles';
import useGeolocation from 'react-hook-geolocation';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import Hidden from '@material-ui/core/Hidden';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import LinearProgress from '@material-ui/core/LinearProgress';
import { useLocation, useHistory } from 'react-router-dom';

import Visible from './components/Visible';
import ErrorBoundary from './components/ErrorBoundary';
import ZipInput from './components/ZipInput';
import Refresher from './components/Refresher';

import TistaCares50 from './resources/TISTA_Philanthropy_50.png';
import TistaCares25 from './resources/TISTA_Philanthropy_25.png';

import { removeDouble } from './util/strings';
import useLocalStorage from './util/useLocalStorage';
import {
  fetchDataFromFips,
  fetchTrendFromFips,
  findLocationData,
  fetchDataFromState,
  fetchDataFromUSA,
  fetchStateHeadlines,
  fetchDataSources,
  fetchFipsFromZip,
  fetchHistoric,
  fetchMetroZones,
} from './util/fetch';
import { diffPercent } from './util/math';
import { createUrl, createFipsUrl, decodeUrl } from './util/url';

import './App.css';

import Logo from './resources/tista-logo-1.png';

const UsaMap = React.lazy(() => import('./Panels/UsaMap'));
const Feed = React.lazy(() => import('./Panels/Feed'));
const LocalStatsTable = React.lazy(() => import('./Panels/LocalStatsTable'));
const LocationsTable = React.lazy(() => import('./Panels/LocationsTable'));
const HistoricRates = React.lazy(() => import('./Panels/HistoricRates'));
const CdcNotice = React.lazy(() => import('./components/CdcNotice'));

const gtag = window.gtag
  || (() => {
    // console.log('No Google Analytics Installed');
  });
const fallback = <LinearProgress />;
const emptyObject = {};
const emptyArray = [];

const useStyles = makeStyles((theme) => ({
  logo: {
    [theme.breakpoints.down('xs')]: {
      width: 100,
    },
  },
  localStatsGrid: {
    [theme.breakpoints.down('sm')]: {
      flexFlow: 'column-reverse',
      // padding: '0 !important',
    },
  },
  progress: {
    width: '100%',
    position: 'absolute',
  },
  clickMe: {
    cursor: 'pointer',
    verticalAlign: 'inherit',
  },
  snackbar: {
    color: 'white',
    backgroundColor: theme.palette.error.main,
  },
  usaMap: {
    backgroundColor: 'grey',
  },
  noteCard: {
    backgroundColor: theme.palette.warning.dark,
  },
  helpCard: {
    backgroundColor: theme.palette.info.main,
  },
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    // flexGrow: 1,
    display: 'none',
    fontSize: '1em',
    textTransform: 'uppercase',
    marginLeft: '0.5em',
    [theme.breakpoints.up('lg')]: {
      fontSize: '2em',
    },
    [theme.breakpoints.up('md')]: {
      fontSize: '1.5em',
      display: 'block',
    },
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    minWidth: '100px',
    flexGrow: 1,
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(4),
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
    flexGrow: 1,
  },
  caresLink: {
    padding: theme.spacing(2),
    color: 'white',
    [theme.breakpoints.up('sm')]: {
      // position: "absolute",
      // right: theme.spacing(2),
    },
  },
  metroButton: {
    color: '#222',
    fontWeight: 900,
    backgroundColor: theme.palette.warning.light,
    backgroundImage: theme.gradients.metro,
    [theme.breakpoints.up('lg')]: {
      marginLeft: theme.spacing(2),
    },
    '&:hover': {
      backgroundImage: 'none',
      backgroundColor: theme.palette.warning.dark,
      color: theme.palette.common.white,
    },
  },
}));

function App() {
  const history = useHistory();
  const { pathname = ' ' } = useLocation();
  const [myState, setMyState] = useState('');
  const [myStateName, setMyStateName] = useState('');
  const [loadingZip, setLoadingZip] = useState(false);
  const [headlines, setHeadlines] = useState(emptyArray);
  const [level, setLevel] = useState('usa');
  const [localUsa, setLocalUsa] = useLocalStorage('usaStats', [emptyObject]);
  const [usaStats, setUsaStats] = useState(localUsa);
  const [localState, setLocalState] = useLocalStorage('stateStats', [emptyObject]);
  const [stateStats, setStateStats] = useState(localState);
  const [countyStats, setCountyStats] = useState(emptyObject);
  const [location, setLocation] = useState('');
  const [fips, setFips] = useState('');
  const [lastFipsSearch, setLastFipsSearch] = useState('');
  const [updateLocation, setUpdateLocation] = useState(false);
  const [canUseGeo, setCanUseGeo] = useLocalStorage('canUseGeo', false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sources, setSources] = useState(emptyArray);
  const [zipOptions, setZipOptions] = useState([]);
  const [historic, setHistoric] = useState({ active: [] });
  const geoLocation = useGeolocation();
  const [hasMetro, setHasMetro] = useState(false);
  const [metroCounties, setMetroCounties] = useState([]);
  const [metroZones, setMetroZones] = useState([]);
  const [savedLocations, setSavedLocations] = useLocalStorage('MyLocations', [
    {
      name: 'Montogomery County, MD',
      fips: '24031',
      zip: '20850',
    },
    {
      name: 'Fairfax County, VA',
      fips: '51059',
      zip: '22003',
    },
    {
      name: 'District of Columbia, DC',
      fips: '11001',
      zip: '20202',
    },
    {
      name: 'United States',
      fips: '00000',
    },
  ]);
  const [myLocations, setMyLocations] = useState(savedLocations);

  const goToLevel = useCallback(
    (lvl) => {
      setLevel(lvl);
      if (lvl === 'usa') {
        setMyState('');
        setCountyStats(emptyObject);
        history.push('');
      }
    },
    [history],
  );

  const createAndNavigate = useCallback(
    (row) => {
      let url;
      if (!row.zip && row.fips) url = createFipsUrl(row.fips);
      else url = createUrl(row.zip, row.name);
      if (url) history.push(url);
    },
    [history],
  );

  // Page title
  useEffect(() => {
    if (level !== 'usa') {
      document.title = `${countyStats.name} - TISTA COVID-19 Tracker`;
    } else {
      document.title = 'United States - TISTA COVID-19 Tracker';
    }
  }, [countyStats, level]);

  // USA
  useEffect(() => {
    const f = async () => {
      // console.log('%cFetching USA', 'color: cyan');
      const { data, error } = await fetchDataFromUSA();
      if (data && data.message) {
        setErrorMessage(error);
      } else if (data && data.length) {
        setUsaStats(data);
      } else {
        setErrorMessage('Could not load USA data.');
      }
      if (error) {
        setErrorMessage(error);
      }
    };
    f();
  }, []);

  useEffect(() => {
    setLocalUsa(usaStats);
  }, [usaStats, setLocalUsa]);

  // STATE
  useEffect(() => {
    const f = async () => {
      // console.log('%cFetching STATE', 'color: cyan');
      const { data, error } = await fetchDataFromState();
      if (data && data.message) {
        setErrorMessage(error);
      }
      if (data && data.length) {
        setStateStats(data);
      } else {
        setErrorMessage('Could not load state data.');
      }
      if (error) {
        setErrorMessage(error);
      }
    };
    f();
  }, []);

  useEffect(() => {
    setLocalState(stateStats);
  }, [stateStats, setLocalState]);

  // COUNTY
  useEffect(() => {
    const f = async () => {
      // console.log(`%cFetching COUNTY ${fips}`, 'color: cyan');
      const { data, error } = await fetchDataFromFips(fips);
      if (error) {
        setErrorMessage(error);
      }
      if (data && data.message) {
        setErrorMessage(error);
      } else if (data && data.length) {
        const [place] = data;
        const isMetro = fips.toUpperCase().includes('US');
        setCountyStats({ ...place, name: removeDouble(place.name), isMetro });
        // console.log(`🔴 ${location}`);
        if (isMetro) {
          goToLevel('metro');
        } else {
          goToLevel('county');
          setMyState(place.state_id);
          const state = stateStats.find((x) => x.state_id === place.state_id);
          if (state) {
            setMyStateName(state.name);
          } else {
            setMyStateName('');
          }
        }
        setLoadingZip(false);
        setFips('');
        gtag('event', 'search', {
          event_label: `Zip Search Successful ${location}`,
        });
      } else {
        setErrorMessage(`Could not load county data for FIPS ${fips}.`);
        gtag('event', 'search', {
          event_label: `Zip Search Failed ${location}`,
        });
        setFips('');
        setLocation('');
        setLoadingZip(false);
      }
    };
    const g = async () => {
      const search = location.slice(0, 3);
      if (lastFipsSearch !== search) {
        // console.log(`%cFetching options for ${location}`, 'color: teal');
        const data = await fetchFipsFromZip(location);
        if (data && data.length) {
          // console.log(`%c${data[0].zip}`, 'color: darkgrey');
          setZipOptions(data);
        }
        setLastFipsSearch(search);
      }
    };
    if (location.length >= 3) {
      g();
    }
    if (fips) {
      setLoadingZip(true);
      f();
    }
  }, [location, goToLevel, history, fips, lastFipsSearch, stateStats]);

  useEffect(() => {
    // console.log(`%c${countyStats.name}`, 'color: salmon');
    // console.dir(countyStats);
    const f = (zones) => {
      const metrozone = zones.find((z) => z.county === countyStats.fips);
      // console.log(`set to ${metrozone}`);
      setHasMetro(metrozone);
    };
    const g = async () => {
      const { data, error } = await fetchMetroZones();
      if (error) {
        setErrorMessage(error);
      } else if (data) {
        const zones = data.reduce(
          (acc, next) => [
            ...acc,
            ...next.counties.map(({ fips: cfips }) => ({
              county: cfips,
              name: next.short_name,
              fips: next.fips,
            })),
          ],
          [],
        );
        // console.log('building zone list', zones);
        setMetroZones(data);
        setMetroCounties(zones);
        f(zones);
      }
    };
    if (metroCounties && metroCounties.length) {
      f(metroCounties);
    } else {
      g();
    }
  }, [countyStats, metroCounties]);

  useEffect(() => {
    const f = async () => {
      const pathLocation = pathname.slice(1);
      // console.log(`%c${pathLocation}`, 'color: orange');
      if (pathLocation) {
        const [urlZip, urlFips] = await decodeUrl(pathLocation);
        // console.log(`🔍 ${urlFips}`);
        setFips(urlFips);
        setLocation(urlZip);
      } else {
        setFips('');
        goToLevel('usa');
      }
    };
    f();
  }, [goToLevel, pathname]);

  // ZIP
  useEffect(() => {
    const f = async () => {
      // console.log('%cFetching ZIP', 'color: cyan');
      const { data, error } = await findLocationData(geoLocation);
      if (data && data.message) {
        setErrorMessage(error);
      } else if (data && data.county_fips) {
        createAndNavigate({ fips: data.county_fips });
        setErrorMessage('Getting your location.');
      } else {
        setCanUseGeo(false);
        setErrorMessage('Cannot find location.');
      }
    };
    if (canUseGeo && updateLocation) {
      setUpdateLocation(false);
      f();
    }
  }, [geoLocation, canUseGeo, setCanUseGeo, updateLocation, createAndNavigate]);

  // FEED
  useEffect(() => {
    const f = async () => {
      // console.log('%cFetching FEED', 'color: cyan');
      const { data, error } = await fetchStateHeadlines(myState);
      if (data && data.message) {
        setErrorMessage(data.message);
      } else if (!error) {
        setHeadlines(data);
      } else {
        setErrorMessage(error);
      }
    };
    if (myState) {
      f();
    }
  }, [myState]);

  // Data sources
  useEffect(() => {
    const f = async () => {
      // console.log('%cFetching sources', 'color: cyan');
      const { data, error } = await fetchDataSources();
      if (data && data.message) {
        setErrorMessage(data.message);
      } else if (!error) {
        setSources(data);
      } else {
        setErrorMessage(error);
      }
    };
    f();
  }, []);

  // Historic
  useEffect(() => {
    const f = async () => {
      // console.log('%cFetching historic', 'color: cyan');
      const target = level === 'usa' ? undefined : countyStats.fips;
      const { data, error } = await fetchHistoric(target);
      if (data && data.message) {
        setErrorMessage(data.message);
      } else if (!error) {
        setHistoric(data);
      } else {
        setErrorMessage(error);
      }
    };
    f();
  }, [countyStats, level]);

  function readyLocation(d, zip = undefined) {
    return {
      ...d,
      zip,
      name: removeDouble(d.name),
      active_trend2: diffPercent(d.active, d.active_trend2),
      active_trend7: diffPercent(d.active, d.active_trend7),
      active_trend14: diffPercent(d.active, d.active_trend14),
      active_trend30: diffPercent(d.active, d.active_trend30),
      active_trend60: diffPercent(d.active, d.active_trend60),
      active_trend90: diffPercent(d.active, d.active_trend90),
    };
  }

  // My Locations
  useEffect(() => {
    const f = async (list = []) => {
      // console.log('%cFetching my locations', 'color: yellow');
      // Fetch USA data for country
      await savedLocations.reduce(async (memo, { fips: savedFips, zip }) => {
        // console.log(`%c${savedFips}`, 'color: green; border: yellow 1px solid');
        await memo;
        const { data } = await fetchTrendFromFips(savedFips);
        if (!data) return;
        const [d] = data;
        // console.log(`%c🟡 ${savedFips} ${d.name}`, 'color: goldenrod');
        list.push(readyLocation(d, zip));
      }, undefined);
      setMyLocations(list);
    };
    if (savedLocations.length) {
      if (!savedLocations.some((x) => x.fips === '00000')) {
        f([{ name: 'United States', fips: '00000' }]);
      } else {
        f();
      }
    }
  }, [savedLocations, setMyLocations]);

  const handleLocationChange = (e, value) => {
    if (value) {
      createAndNavigate(value);
      // setLocation(value.zip);
    }
  };

  const handleLocationInputChange = (e, value) => {
    // console.log(`%c${value}`, 'color: green');
    setLocation(value);
  };

  const handleGeoToggle = () => {
    setCanUseGeo(true);
    setUpdateLocation(true);
  };

  const handleCloseSnack = () => {
    setErrorMessage('');
  };

  const addToMyLocations = (thisLocation) => {
    const { fips: localFips } = thisLocation;
    if (!localFips) return;
    const index = myLocations.findIndex((x) => x.fips === localFips);
    if (index < 0) {
      if (myLocations.length >= 11) {
        // console.log('LIST FULL');
        setErrorMessage('Tracked county list is full. Please remove an entry to add a new county.');
        return;
      }

      setSavedLocations([
        ...myLocations,
        {
          ...thisLocation,
          zip: location,
          name: removeDouble(thisLocation.name),
        },
      ]);
    } else {
      setErrorMessage('This location is already tracked.');
    }
  };

  const removeFromMyLocations = (removedFips) => {
    const index = myLocations.findIndex((x) => x.fips === removedFips);
    if (index >= 0) {
      // console.log(`%cDELETING ${removedFips}`, 'color: red');
      if (myLocations.length === 1) {
        setSavedLocations(emptyArray);
        setMyLocations(emptyArray);
      } else {
        const a = myLocations.slice(0, index);
        const b = myLocations.slice(index + 1);
        setSavedLocations([...a, ...b]);
      }
    }
  };

  const MemoFeed = useMemo(() => <Feed data={{ myState, headlines, loadingZip }} />, [
    headlines,
    loadingZip,
    myState,
  ]);
  // const MemoMap = useMemo();
  const MemoStatsUsa = useMemo(
    () => (
      <LocalStatsTable
        sources={sources}
        data={usaStats[0]}
        getFlag
        level="usa"
        mini={level === 'county'}
      />
    ),
    [sources, usaStats, level],
  );
  const MemoStatsState = useMemo(
    () => (
      <LocalStatsTable
        sources={sources}
        data={stateStats.find((x) => x.state_id === myState)}
        getFlag
        level="state"
      />
    ),
    [sources, stateStats, myState],
  );
  const MemoStatsCounty = useMemo(
    () => (
      <LocalStatsTable
        sources={sources}
        data={countyStats}
        level="county"
        isMetro={countyStats.isMetro}
      />
    ),
    [sources, countyStats],
  );

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar position="sticky">
        <Toolbar>
          <Hidden only="xs">
            <input
              type="image"
              className={`${classes.clickMe} ${classes.logo}`}
              src={Logo}
              alt="TISTA Logo"
              onClick={() => {
                goToLevel('usa');
              }}
              onKeyDown={() => {
                goToLevel('usa');
              }}
            />
          </Hidden>
          <Typography variant="h5" className={classes.title}>
            ● COVID-19 Tracker
          </Typography>

          <IconButton
            className={classes.menuButton}
            onClick={handleGeoToggle}
            color={canUseGeo ? 'inherit' : 'default'}
          >
            <MyLocationIcon />
          </IconButton>

          <div className={classes.search}>
            <ZipInput
              onChange={handleLocationChange}
              onInputChange={handleLocationInputChange}
              // onClick={handleFocusInput}
              inputValue={location}
              options={zipOptions}
              textFieldParams={{
                placeholder: 'Enter zip code',
                classes: {
                  root: classes.inputRoot,
                },
              }}
            />
            {loadingZip && <LinearProgress color="secondary" className="progress" />}
          </div>
          <Hidden mdDown>
            <Link
              href="http://www.tistacares.com"
              target="_blank"
              rel="noopener"
              variant="body1"
              className={classes.caresLink}
              style={{
                fontSize: '12px',
                textAlign: 'center',
                padding: '8px 16px',
              }}
            >
              <img src={TistaCares50} alt="Tista Cares" style={{ height: 40 }} />
              <div>www.tistacares.com</div>
            </Link>
          </Hidden>
          <Hidden lgUp>
            <Link
              href="http://www.tistacares.com"
              target="_blank"
              rel="noopener"
              variant="body1"
              className={classes.caresLink}
              style={{ fontSize: '12px', textAlign: 'center' }}
            >
              <img src={TistaCares25} alt="Tista Cares" />
              <div>tistacares.com</div>
            </Link>
          </Hidden>
        </Toolbar>
      </AppBar>

      <Snackbar
        open={!!errorMessage}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={3500}
      >
        <SnackbarContent variant="elevation" message={errorMessage} className={classes.snackbar} />
      </Snackbar>

      <Refresher />

      <Container maxWidth={false}>
        <Grid container spacing={2} justify="space-between">
          <Grid item container xs={12} justify="center">
            <Suspense fallback={fallback}>
              <CdcNotice zones={metroZones} />
            </Suspense>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Link
              component="button"
              className={classes.clickMe}
              variant="h4"
              color="textPrimary"
              underline="always"
              onClick={() => {
                goToLevel('usa');
              }}
            >
              USA
            </Link>
            <Visible condition={level !== 'usa' && level !== 'metro'}>
              {' / '}
              <Typography
                component="span"
                variant="h4"
                color="textPrimary"
                onClick={() => goToLevel('county')}
              >
                {myStateName}
              </Typography>
            </Visible>
            <Visible condition={level !== 'usa'}>
              {' / '}
              <Typography component="span" variant="h4" color="textPrimary">
                {`${countyStats.name}`}
              </Typography>
            </Visible>
          </Grid>
          <Grid item xs={12} lg={6}>
            {hasMetro ? (
              <Button
                classes={{
                  containedSecondary: classes.metroButton,
                }}
                variant="contained"
                color="secondary"
                onClick={() => createAndNavigate(hasMetro)}
              >
                {'View '}
                {hasMetro.name}
                {' ▶'}
              </Button>
            ) : null}
          </Grid>

          <Grid
            container
            item
            xs={12}
            md={6}
            lg={6}
            spacing={2}
            id="local-stats-grid"
            className={classes.localStatsGrid}
          >
            <Grid item xs={12}>
              <ErrorBoundary>
                <Suspense fallback={fallback}>{MemoStatsUsa}</Suspense>
              </ErrorBoundary>
            </Grid>
            <Visible condition={level === 'state' || level === 'county'}>
              <Grid item xs={12}>
                <ErrorBoundary>
                  <Suspense fallback={fallback}>{MemoStatsState}</Suspense>
                </ErrorBoundary>
              </Grid>
            </Visible>
            <Visible condition={level === 'county' || level === 'metro'}>
              <Grid item xs={12}>
                <ErrorBoundary>
                  <Suspense fallback={fallback}>{MemoStatsCounty}</Suspense>
                </ErrorBoundary>
              </Grid>
            </Visible>
          </Grid>

          <Grid item container xs={12} md={6} spacing={2}>
            <Grid item xs={12}>
              <ErrorBoundary>
                <Suspense fallback={fallback}>
                  <UsaMap data={level !== 'usa' ? countyStats : emptyObject} level={level} />
                </Suspense>
              </ErrorBoundary>
            </Grid>

            <Grid item xs={12}>
              <ErrorBoundary>
                <Suspense fallback={fallback}>
                  <HistoricRates level={level} county={countyStats} historic={historic} />
                </Suspense>
              </ErrorBoundary>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <ErrorBoundary>
              <Suspense fallback={fallback}>
                <LocationsTable
                  data={myLocations}
                  addFunction={addToMyLocations}
                  removeFunction={removeFromMyLocations}
                  thisLocation={countyStats}
                  navigate={createAndNavigate}
                />
              </Suspense>
            </ErrorBoundary>
          </Grid>

          <Grid item xs={12}>
            <Visible condition={level === 'county'}>
              <ErrorBoundary>
                <Suspense fallback={fallback}>{MemoFeed}</Suspense>
              </ErrorBoundary>
            </Visible>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default App;
