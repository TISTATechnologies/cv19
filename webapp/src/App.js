import React, {
  Suspense,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import useGeolocation from "react-hook-geolocation";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import InputBase from "@material-ui/core/InputBase";
import CardContent from "@material-ui/core/CardContent";
import MyLocationIcon from "@material-ui/icons/MyLocation";
import SearchIcon from "@material-ui/icons/Search";
import CloseIcon from "@material-ui/icons/Close";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Popover from "@material-ui/core/Popover";
import Hidden from '@material-ui/core/Hidden';

import IconButton from "@material-ui/core/IconButton";
import Link from "@material-ui/core/Link";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import LinearProgress from "@material-ui/core/LinearProgress";
import { useLocation, useHistory } from "react-router-dom";

import Visible from "./components/Visible";
import ErrorBoundary from "./components/ErrorBoundary";

import { fade, makeStyles } from "@material-ui/core/styles";
import useLocalStorage from "./util/useLocalStorage";
import useDebounce from "./util/useDebounce";
import {
  fetchDataFromZip,
  findLocationData,
  fetchDataFromState,
  fetchDataFromUSA,
  fetchStateHeadlines,
  fetchDataSources,
} from "./util/fetch";
import "./App.css";

import defaultUsa from "./resources/defaultUsa.json";
import defaultStates from "./resources/defaultStates.json";

import Logo from "./resources/tista-logo-1.png";

const UsaMap = React.lazy(() => import("./Panels/UsaMap"));
const Feed = React.lazy(() => import("./Panels/Feed"));
const LocalStatsTable = React.lazy(() => import("./Panels/LocalStatsTable"));

const fallback = <LinearProgress />;
const emptyObject = {};
const emptyArray = [];

const useStyles = makeStyles((theme) => ({
  logo: {
    [theme.breakpoints.down("xs")]: {
      width: 100,
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
    [theme.breakpoints.up("sm")]: {
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
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(1),
      width: "auto",
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
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
    },
  },
  caresLink: {
    position: "absolute",
    right: theme.spacing(4),
  },
}));

function App() {
  const history = useHistory();
  const { pathname = " " } = useLocation();
  const [myState, setMyState] = useState("");
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
  const debouncedLocation = useDebounce(location, 500);
  const [updateLocation, setUpdateLocation] = useState(false);
  const [canUseGeo, setCanUseGeo] = useLocalStorage("canUseGeo", false);
  const [errorMessage, setErrorMessage] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);
  const [localNoticeOpen, setLocalNoticeOpen] = useLocalStorage(
    "showCDC",
    true
  );
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(localNoticeOpen);
  const [firstSearch, setFirstSearch] = useLocalStorage("firstSearch", true);
  const [sources, setSources] = useState(emptyArray);
  const geoLocation = useGeolocation();

  const goToLevel = useCallback(
    (lvl) => {
      setLevel(lvl);
      setLocation("");
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
        setSnackOpen(true);
      } else if (data && data.length) {
        setUsaStats(data);
      } else {
        setErrorMessage("Could not load USA data.");
        setSnackOpen(true);
      }
      if (error) {
        setErrorMessage(error);
        setSnackOpen(true);
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
        setSnackOpen(true);
      }
      if (data && data.length) {
        setStateStats(data);
      } else {
        setErrorMessage("Could not load state data.");
        setSnackOpen(true);
      }
      if (error) {
        setErrorMessage(error);
        setSnackOpen(true);
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
      const { data, error } = await fetchDataFromZip(debouncedLocation);
      if (error) {
        setErrorMessage(error);
        setSnackOpen(true);
      }
      if (data & data.message) {
        setErrorMessage(error);
        setSnackOpen(true);
      } else if (data && data.length) {
        setLocation("");
        setCountyStats(data);
        goToLevel("county");
        setLoadingZip(false);
        setMyState(data[0].state_id);
        history.push(debouncedLocation);
      } else {
        setErrorMessage(`Could not load county data for ${debouncedLocation}.`);
        setSnackOpen(true);
        setLoadingZip(false);
      }
    };
    if (debouncedLocation.length >= 5) {
      setLoadingZip(true);
      f();
    }
  }, [debouncedLocation, goToLevel, history]);

  useEffect(() => {
    console.log(`%c${countyStats}`, "color: salmon");
  }, [countyStats]);

  useEffect(() => {
    const pathLocation = pathname.slice(1);
    if (pathLocation) {
      setLocation(pathLocation);
    } else {
      goToLevel("usa");
    }
  }, [goToLevel, pathname]);

  // ZIP
  useEffect(() => {
    const f = async () => {
      console.log(`%cFetching ZIP`, "color: cyan");
      const { data, error } = await findLocationData(geoLocation);
      if (data && data.message) {
        setErrorMessage(error);
        setSnackOpen(true);
      } else if (data) {
        setLocation(data.zip);
        setErrorMessage("Getting zip code from your location.");
        setSnackOpen(true);
      } else {
        setCanUseGeo(false);
        setErrorMessage("Cannot find location.");
        setSnackOpen(true);
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
        setSnackOpen(true);
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
        setSnackOpen(true);
      }
    };
    f();
  }, []);

  const handleClosePopover = () => {
    console.log(`%cCLOSE  `, "color: magenta");
    setFirstSearch(false);
    setOpen(false);
  };

  const handleFocusInput = (e) => {
    if (firstSearch) {
      setAnchorEl(e.currentTarget);
      setOpen(true);
    }
  };

  const handleLocationChange = (e) => {
    console.log(`%c${e.target.value}`, "color: pink");
    setLocation(e.target.value);
  };

  const handleGeoToggle = () => {
    setCanUseGeo(true);
    setUpdateLocation(true);
  };

  const handleCloseSnack = () => {
    setSnackOpen(false);
    setErrorMessage("");
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
      />
    ),
    [sources, usaStats]
  );
  const MemoStatsState = useMemo(
    () => (
      <LocalStatsTable
        sources={sources}
        data={stateStats.find(
          (x) => x.state_name === countyStats[0].state_name
        )}
        getFlag
        level={"state"}
      />
    ),
    [sources, stateStats, countyStats]
  );
  const MemoStatsCounty = useMemo(
    () => (
      <LocalStatsTable
        sources={sources}
        data={countyStats[0]}
        level={"county"}
      />
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
            ● CV-19 Tracker
          </Typography>

          <IconButton
            className={classes.menuButton}
            onClick={handleGeoToggle}
            color={canUseGeo ? "inherit" : "default"}
          >
            <MyLocationIcon />
          </IconButton>

          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              inputProps={{ "aria-label": "search" }}
              onChange={handleLocationChange}
              onClick={handleFocusInput}
              placeholder="Enter zip code"
              value={location}
              classes={{
                input: classes.inputInput,
                root: classes.inputRoot,
              }}
            />
            {loadingZip && (
              <LinearProgress color="secondary" className={"progress"} />
            )}
          </div>
          <Hidden smDown>
          <Link
            href="http://www.tistacares.com"
            target="_blank"
            rel="noopener"
            color="textSecondary"
            variant="h6"
            className={classes.caresLink}
          >
            www.tistacares.com
          </Link>
          </Hidden>
        </Toolbar>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClosePopover}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <CardContent className={classes.helpCard}>
            To find the most relevant statistics for you, this application
            searches by your <strong>zip code</strong>.
          </CardContent>
        </Popover>
      </AppBar>

      <Snackbar
        open={snackOpen}
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
        <Grid container spacing={2} justify="center">
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
                {`${countyStats[0].state_name}`}
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
                {`${countyStats[0].location_name}`}
              </Typography>
            </Visible>
          </Grid>

          <Grid container item xs={12} md={6} lg={6} spacing={0}>
            <Visible condition={level === "usa"}>
              <Grid item xs={12} style={{paddingBottom: '0px'}} >
                <ErrorBoundary>
                  <Suspense fallback={fallback}>{MemoStatsUsa}</Suspense>
                </ErrorBoundary>
              </Grid>
            </Visible>
            <Visible condition={level === "state" || level === "county"}>
              <Grid item xs={12} style={{paddingBottom: '8px'}} >
                <ErrorBoundary>
                  <Suspense fallback={fallback}>{MemoStatsState}</Suspense>
                </ErrorBoundary>
              </Grid>
            </Visible>
            <Visible condition={level === "county"}>
              <Grid item xs={12} style={{paddingBottom: '0px'}} >
                <ErrorBoundary>
                  <Suspense fallback={fallback}>{MemoStatsCounty}</Suspense>
                </ErrorBoundary>
              </Grid>
            </Visible>
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <ErrorBoundary>
              <Suspense fallback={fallback}>
                <UsaMap data={level !== "usa" ? countyStats[0] : emptyObject} />
              </Suspense>
            </ErrorBoundary>
          </Grid>

          <Grid item xs={12} lg={12}>
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
