import React, {
  Suspense,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { fade, makeStyles } from "@material-ui/core/styles";
import useGeolocation from "react-hook-geolocation";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import MyLocationIcon from "@material-ui/icons/MyLocation";
import CloseIcon from "@material-ui/icons/Close";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Hidden from "@material-ui/core/Hidden";

import IconButton from "@material-ui/core/IconButton";
import Link from "@material-ui/core/Link";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import LinearProgress from "@material-ui/core/LinearProgress";
import { useLocation, useHistory } from "react-router-dom";

import Visible from "./components/Visible";
import ErrorBoundary from "./components/ErrorBoundary";
import ZipInput from "./components/ZipInput";

import TistaCares50 from "./resources/TISTA_Philanthropy_50.png";
import TistaCares25 from "./resources/TISTA_Philanthropy_25.png";

import { removeDouble } from "./util/strings";
import useLocalStorage from "./util/useLocalStorage";
import {
  fetchDataFromFips,
  fetchTrendFromFips,
  findLocationData,
  fetchDataFromState,
  fetchDataFromUSA,
  fetchStateHeadlines,
  fetchDataSources,
  fetchFipsFromZip,
} from "./util/fetch";
import "./App.css";

import defaultUsa from "./resources/defaultUsa.json";
import defaultStates from "./resources/defaultStates.json";

import Logo from "./resources/tista-logo-1.png";

const UsaMap = React.lazy(() => import("./Panels/UsaMap"));
const Feed = React.lazy(() => import("./Panels/Feed"));
const LocalStatsTable = React.lazy(() => import("./Panels/LocalStatsTable"));
const LocationsTable = React.lazy(() => import("./Panels/LocationsTable"));

const gtag =
  window.gtag ||
  (([a, b, c, d, e, f]) => {
    console.log("No Google Analytics Installed");
  });
const fallback = <LinearProgress />;
const emptyObject = {};
const emptyArray = [];

function diffPercent(today, delta) {
  if (today - delta === 0) return 0;
  return delta / (today - delta);
}
function createUrl(zipCode, county) {
  const head = zipCode ? `${zipCode}-` : "";
  const tail = county
    .split(/ |,/)
    .filter((x) => x)
    .join("-")
    .toLowerCase();
  return `${head}${tail}`;
}

function createFipsUrl(fips) {
  if (!fips) return "";
  return `fips-${fips}`;
}

async function decodeUrl(url) {
  const [zip, firstword] = url.toLowerCase().split("-");
  if (zip === "fips") return ["", firstword];
  if (!Number.parseInt(zip)) return ["", ""];
  const fipsList = await fetchFipsFromZip(zip);
  if (fipsList) {
    const matches = fipsList.filter((f) => f.zip === zip);
    if (matches) {
      const match = matches.find((f) =>
        f.name.toLowerCase().includes(firstword)
      );
      if (match) return [zip, match.fips];
      return [zip, matches[0].fips];
    }
  }
  return ["", ""];
}

const useStyles = makeStyles((theme) => ({
  logo: {
    [theme.breakpoints.down("xs")]: {
      width: 100,
    },
  },
  localStatsGrid: {
    [theme.breakpoints.down("sm")]: {
      flexFlow: "column-reverse",
      // padding: '0 !important',
    },
  },
  progress: {
    width: "100%",
    position: "absolute",
  },
  clickMe: {
    cursor: "pointer",
  },
  snackbar: {
    backgroundColor: theme.palette.error.main,
  },
  usaMap: {
    backgroundColor: "grey",
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
    display: "none",
    fontSize: "1em",
    textTransform: "uppercase",
    marginLeft: "0.5em",
    [theme.breakpoints.up("lg")]: {
      fontSize: "2em",
    },
    [theme.breakpoints.up("md")]: {
      fontSize: "1.5em",
      display: "block",
    },
  },
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    minWidth: "100px",
    flexGrow: 1,
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(4),
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRoot: {
    color: "inherit",
    flexGrow: 1,
  },
  caresLink: {
    padding: theme.spacing(2),
    color: "white",
    [theme.breakpoints.up("sm")]: {
      // position: "absolute",
      // right: theme.spacing(2),
    },
  },
}));

function App() {
  const history = useHistory();
  const { pathname = " " } = useLocation();
  const [myState, setMyState] = useState("");
  const [myStateName, setMyStateName] = useState("");
  const [loadingZip, setLoadingZip] = useState(false);
  const [headlines, setHeadlines] = useState(emptyArray);
  const [level, setLevel] = useState("usa");
  const [localUsa, setLocalUsa] = useLocalStorage("usaStats", defaultUsa);
  const [usaStats, setUsaStats] = useState(localUsa);
  const [localState, setLocalState] = useLocalStorage(
    "stateStats",
    defaultStates
  );
  const [stateStats, setStateStats] = useState(localState);
  const [countyStats, setCountyStats] = useState([emptyObject]);
  const [location, setLocation] = useState("");
  const [fips, setFips] = useState("");
  const [lastFipsSearch, setLastFipsSearch] = useState("");
  const [updateLocation, setUpdateLocation] = useState(false);
  const [canUseGeo, setCanUseGeo] = useLocalStorage("canUseGeo", false);
  const [errorMessage, setErrorMessage] = useState("");
  const [localNoticeOpen, setLocalNoticeOpen] = useLocalStorage(
    "showCDC",
    true
  );
  const [noticeOpen, setNoticeOpen] = useState(localNoticeOpen);
  const [sources, setSources] = useState(emptyArray);
  const [zipOptions, setZipOptions] = useState([]);
  const geoLocation = useGeolocation();
  const [savedLocations, setSavedLocations] = useLocalStorage("MyLocations", [
    {
      name: "Montogomery County, MD",
      fips: "24031",
      zip: "20850",
    },
    {
      name: "Fairfax County, VA",
      fips: "51059",
      zip: "22003",
    },
    {
      name: "District of Columbia, DC",
      fips: "11001",
      zip: "20202",
    },
  ]);
  const [myLocations, setMyLocations] = useState(savedLocations);

  const goToLevel = useCallback(
    (lvl) => {
      setLevel(lvl);
      if (lvl === "usa") {
        setMyState("");
        history.push("");
      }
    },
    [history]
  );

  useEffect(() => {
    setLocalNoticeOpen(noticeOpen);
  }, [noticeOpen, setLocalNoticeOpen]);

  // USA
  useEffect(() => {
    const f = async () => {
      console.log(`%cFetching USA`, "color: cyan");
      const { data, error } = await fetchDataFromUSA();
      if (data & data.message) {
        setErrorMessage(error);
      } else if (data && data.length) {
        setUsaStats(data);
      } else {
        setErrorMessage("Could not load USA data.");
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
      console.log(`%cFetching STATE`, "color: cyan");
      const { data, error } = await fetchDataFromState();
      if (data & data.message) {
        setErrorMessage(error);
      }
      if (data && data.length) {
        setStateStats(data);
      } else {
        setErrorMessage("Could not load state data.");
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
      console.log(`%cFetching COUNTY`, "color: cyan");
      const { data, error } = await fetchDataFromFips(fips);
      if (error) {
        setErrorMessage(error);
      }
      if (data && data.message) {
        setErrorMessage(error);
      } else if (data && data.length) {
        const [place] = data;
        setCountyStats({ ...place, name: removeDouble(place.name) });
        console.log(`🔴 ${location}`);
        console.dir(place);
        goToLevel("county");
        setLoadingZip(false);
        setFips("");
        setMyState(place.state_id);
        setMyStateName(
          stateStats.find((x) => x.state_id === place.state_id).name
        );
        gtag("event", "search", {
          event_label: `Zip Search Successful ${location}`,
          event_callback: () => console.log("GTAG sent"),
        });
      } else {
        setErrorMessage(`Could not load county data for FIPS ${fips}.`);
        gtag("event", "search", {
          event_label: `Zip Search Failed ${location}`,
          event_callback: () => console.log("GTAG sent"),
        });
        setFips("");
        setLocation("");
        setLoadingZip(false);
      }
    };
    const g = async () => {
      const search = location.slice(0, 3);
      if (lastFipsSearch !== search) {
        console.log(`%cFetching options for ${location}`, "color: teal");
        const data = await fetchFipsFromZip(location);
        if (data && data.length) {
          console.log(`%c${data[0].zip}`, "color: darkgrey");
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
    console.log(`%c${countyStats}`, "color: salmon");
  }, [countyStats]);

  useEffect(() => {
    const f = async () => {
      const pathLocation = pathname.slice(1);
      console.log(`%c${pathLocation}`, "color: orange");
      if (pathLocation) {
        const [urlZip, urlFips] = await decodeUrl(pathLocation);
        console.log(`🔍 ${urlFips}`);
        setFips(urlFips);
        setLocation(urlZip);
      } else {
        setFips("");
        goToLevel("usa");
      }
    };
    f();
  }, [goToLevel, pathname]);

  // ZIP
  useEffect(() => {
    const f = async () => {
      console.log(`%cFetching ZIP`, "color: cyan");
      const { data, error } = await findLocationData(geoLocation);
      if (data && data.message) {
        setErrorMessage(error);
      } else if (data && data.county_fips) {
        createAndNavigate({ fips: data.county_fips });
        setErrorMessage("Getting your location.");
      } else {
        setCanUseGeo(false);
        setErrorMessage("Cannot find location.");
      }
    };
    if (canUseGeo && updateLocation) {
      setUpdateLocation(false);
      f();
    }
  }, [geoLocation, canUseGeo, setCanUseGeo, updateLocation]);

  // FEED
  useEffect(() => {
    const f = async () => {
      console.log(`%cFetching FEED`, "color: cyan");
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
      console.log(`%cFetching sources`, "color: cyan");
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

  useEffect(() => {
    const f = async () => {
      console.log(`%cFetching my locations`, "color: yellow");
      const list = [];
      await savedLocations.reduce(async (memo, { fips, zip }) => {
        await memo;
        const { data } = await fetchTrendFromFips(fips);
        const [d] = data;
        console.log(`%c🟡 ${fips} ${d.name}`, "color: goldenrod");
        list.push({
          ...d,
          zip,
          name: removeDouble(d.name),
          active_trend2: diffPercent(d.active, d.active_trend2),
          active_trend7: diffPercent(d.active, d.active_trend7),
          active_trend30: diffPercent(d.active, d.active_trend30),
          active_trend90: diffPercent(d.active, d.active_trend90),
        });
      }, undefined);
      setMyLocations(list);
    };
    if (savedLocations.length) {
      f();
    }
  }, [savedLocations, setMyLocations]);

  const handleLocationChange = (e, value, reason) => {
    console.log(`%c👍 ${reason}`, "color: pink");
    console.dir(value);
    if (value) {
      createAndNavigate(value);
      // setLocation(value.zip);
    }
  };

  const handleLocationInputChange = (e, value, reason) => {
    console.log(`%c${value}`, "color: green");
    setLocation(value);
  };

  const handleGeoToggle = () => {
    setCanUseGeo(true);
    setUpdateLocation(true);
  };

  const handleCloseSnack = () => {
    setErrorMessage("");
  };

  const addToMyLocations = (thisLocation) => {
    const { fips } = thisLocation;
    if (!fips) return;
    const index = myLocations.findIndex((x) => x.fips === fips);
    if (index < 0) {
      if (myLocations.length >= 10) {
        console.log("LIST FULL");
        setErrorMessage(
          "Tracked county list is full. Please remove an entry to add a new county."
        );
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
      setErrorMessage("County is already tracked.");
      return;
    }
  };

  const createAndNavigate = (row) => {
    console.dir(row);
    let url;
    if (!row.zip && row.fips) url = createFipsUrl(row.fips);
    else url = createUrl(row.zip, row.name);
    if (url) history.push(url);
  };

  const removeFromMyLocations = (fips) => {
    const index = myLocations.findIndex((x) => x.fips === fips);
    if (index >= 0) {
      console.log(`%cDELETING ${fips}`, "color: red");
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

  // const MemoFeed = useMemo();
  // const MemoMap = useMemo();
  const MemoStatsUsa = useMemo(
    () => (
      <LocalStatsTable
        sources={sources}
        data={usaStats[0]}
        getFlag
        level={"usa"}
        mini={level !== "usa"}
      />
    ),
    [sources, usaStats, level]
  );
  const MemoStatsState = useMemo(
    () => (
      <LocalStatsTable
        sources={sources}
        data={stateStats.find((x) => x.state_id === myState)}
        getFlag
        level={"state"}
      />
    ),
    [sources, stateStats, myState]
  );
  const MemoStatsCounty = useMemo(
    () => (
      <LocalStatsTable sources={sources} data={countyStats} level={"county"} />
    ),
    [sources, countyStats]
  );

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar position="sticky">
        <Toolbar>
          <img
            className={`${classes.clickMe} ${classes.logo}`}
            src={Logo}
            alt="TISTA Logo"
            onClick={() => {
              goToLevel("usa");
            }}
          />
          <Typography variant="h5" className={classes.title}>
            ● COVID-19 Tracker
          </Typography>

          <IconButton
            className={classes.menuButton}
            onClick={handleGeoToggle}
            color={canUseGeo ? "inherit" : "default"}
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
                placeholder: "Enter zip code",
                classes: {
                  root: classes.inputRoot,
                },
              }}
            />
            {loadingZip && (
              <LinearProgress color="secondary" className={"progress"} />
            )}
          </div>
          <Hidden mdDown>
            <Link
              href="http://www.tistacares.com"
              target="_blank"
              rel="noopener"
              variant="body1"
              className={classes.caresLink}
              style={{
                fontSize: "12px",
                textAlign: "center",
                padding: "8px 16px",
              }}
            >
              <img
                src={TistaCares50}
                alt="Tista Cares"
                style={{ height: 40 }}
              />
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
              style={{ fontSize: "12px", textAlign: "center" }}
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
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={3500}
      >
        <SnackbarContent
          variant="elevation"
          message={errorMessage}
          className={classes.snackbar}
        />
      </Snackbar>

      <Container maxWidth={false}>
        <Grid container spacing={2} justify="space-between">
          <Grid item container xs={12} justify="center">
            <Grid item xs={12} sm={8}>
              <Visible condition={noticeOpen}>
                <ListItem className={classes.noteCard}>
                  <ListItemText variant="h6" component="p" align="center">
                    NOTE: New CDC guidance could cause an increase in the number
                    of deaths attributed to COVID-19.{" "}
                    <Link
                      href="https://www.cdc.gov/nchs/data/nvss/coronavirus/Alert-2-New-ICD-code-introduced-for-COVID-19-deaths.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      color="textSecondary"
                      underline="always"
                    >
                      See this report for more details.
                    </Link>
                  </ListItemText>
                  <ListItemIcon>
                    <IconButton onClick={() => setNoticeOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </ListItemIcon>
                </ListItem>
              </Visible>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Link
              className={classes.clickMe}
              variant="h4"
              color="textPrimary"
              underline="always"
              onClick={() => {
                goToLevel("usa");
              }}
            >
              USA
            </Link>
            <Visible condition={level !== "usa"}>
              {" / "}
              <Typography
                component="span"
                variant="h4"
                color="textPrimary"
                onClick={() => goToLevel("county")}
              >
                {myStateName}
              </Typography>
            </Visible>
            <Visible condition={level !== "usa"}>
              {" / "}
              <Typography
                component="span"
                variant="h4"
                color="textPrimary"
                onClick={() => goToLevel("county")}
              >
                {`${countyStats.name}`}
              </Typography>
            </Visible>
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
            <Visible condition={level === "state" || level === "county"}>
              <Grid item xs={12}>
                <ErrorBoundary>
                  <Suspense fallback={fallback}>{MemoStatsState}</Suspense>
                </ErrorBoundary>
              </Grid>
            </Visible>
            <Visible condition={level === "county"}>
              <Grid item xs={12}>
                <ErrorBoundary>
                  <Suspense fallback={fallback}>{MemoStatsCounty}</Suspense>
                </ErrorBoundary>
              </Grid>
            </Visible>
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <ErrorBoundary>
              <Suspense fallback={fallback}>
                <UsaMap data={level !== "usa" ? countyStats : emptyObject} />
              </Suspense>
            </ErrorBoundary>
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
            <ErrorBoundary>
              <Suspense fallback={fallback}>
                <Feed data={{ myState, headlines, loadingZip }} />
              </Suspense>
            </ErrorBoundary>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default App;
