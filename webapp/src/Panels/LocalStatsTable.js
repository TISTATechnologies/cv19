import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import InfoIcon from '@material-ui/icons/Info';
import Popover from '@material-ui/core/Popover';
import ListItem from '@material-ui/core/ListItem';

import { makeStyles } from '@material-ui/core/styles';
import Visible from '../components/Visible';

const defaultFlag = {
  backgroundImage: 'linear-gradient(rgba(16, 16, 16, 0.5), rgba(16, 16, 16, 0.1))',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

const useStyles = makeStyles((theme) => ({
  tooltip: { fontSize: '1.1rem', backgroundColor: '#222' },
  arrow: {
    color: '#222',
  },
  iconButton: {
    position: 'absolute',
    right: '0',
    color: '#222',
    cursor: 'pointer',
  },
  confirmed: { color: theme.palette.grey[500], backgroundColor: '#222' },
  active: { color: theme.palette.warning.main, backgroundColor: '#222' },
  deaths: { color: theme.palette.error.main, backgroundColor: '#222' },
  recovered: { color: theme.palette.success.main, backgroundColor: '#222' },
  hospitalized: { color: theme.palette.info.main, backgroundColor: '#222' },
  confirmedBorder: { border: '1px solid', borderColor: theme.palette.grey[500] },
  activeBorder: { border: '1px solid', borderColor: theme.palette.warning.main },
  deathsBorder: { border: '1px solid', borderColor: theme.palette.error.main },
  recoveredBorder: { border: '1px solid', borderColor: theme.palette.success.main },
  hospitalizedBorder: { border: '1px solid', borderColor: theme.palette.info.main },
  title: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.2em',
    },
  },
  bar: {
    margin: '0 -16px',
    color: '#222',
    position: 'relative',
  },
  confirmedBar: {
    backgroundColor: theme.palette.grey[500],
  },
  activeBar: {
    backgroundColor: theme.palette.warning.main,
  },
  deathsBar: {
    backgroundColor: theme.palette.error.main,
  },
  recoveredBar: {
    backgroundColor: theme.palette.success.main,
  },
  hospitalizedBar: {
    backgroundColor: theme.palette.info.main,
  },
  rates: { color: 'white' },
  flag: {
    position: 'absolute',
  },
  statGridBlock: {
    minWidth: '200px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.8em',
    },
  },
  metro: {
    borderImage: theme.gradients.metro,
    border: '2px solid transparent',
    borderRadius: 4,
    borderImageSlice: 1,
    backgroundColor: theme.palette.warning.dark,
  },
}));

const bigNumberFormat = new Intl.NumberFormat('en', {});
const updatedTimeFormat = (date) => (date.toString() !== 'Invalid Date'
  ? `Last updated: ${date.toLocaleString('en', {
    timeStyle: 'short',
    dateStyle: 'long',
  })}`
  : '---');

const StatBlock = ({
  name,
  value = 'N/A',
  subname = 'per 100k',
  subvalue = '',
  colorClass = '',
  level = 'x',
  mini = false,
  description = '',
}) => {
  const classes = useStyles();
  let formattedVal = value;
  let formattedSubVal = subvalue;

  if (Number.isNaN(value)) {
    formattedVal = 'N/A';
  } else if (typeof value === 'number') {
    formattedVal = bigNumberFormat.format(value);
  }

  if (Number.isNaN(subvalue)) {
    formattedSubVal = 'N/A';
  } else if (typeof subvalue === 'number') {
    formattedSubVal = Math.ceil(subvalue * 1e5);
  }

  const Hover = ({ children, placement = 'left' }) => (
    <Tooltip
      enterTouchDelay={100}
      arrow
      title={description}
      classes={{
        tooltip: `${classes.tooltip} ${classes[`${colorClass}Border`]}`,
        arrow: classes.arrow,
      }}
      placement={placement}
    >
      {children}
    </Tooltip>
  );

  if (mini) {
    return (
      <Hover placement="bottom">
        <Card className={`${classes[colorClass]}`} id={`${level}-${colorClass}`}>
          <Typography
            variant="h6"
            align="center"
            id={`${level}-${colorClass}-value`}
            className={`${classes[`${colorClass}Bar`]} ${classes.bar}`}
          >
            {formattedVal}
          </Typography>
        </Card>
      </Hover>
    );
  }

  return (
    <Card
      className={`${classes.statGridBlock} ${classes[colorClass]}`}
      id={`${level}-${colorClass}`}
    >
      <CardContent>
        <Hidden only="xs">
          <Typography variant="h4" align="center" id={`${level}-${colorClass}-value`}>
            {formattedVal}
          </Typography>
          <Typography
            variant="h6"
            align="center"
            className={classes.rates}
            id={`${level}-${colorClass}-rate`}
          >
            {formattedSubVal}
            {' '}
            {subname}
          </Typography>
          <Typography
            variant="h5"
            align="center"
            className={`${classes[`${colorClass}Bar`]} ${classes.bar}`}
          >
            {name}
            <Hover>
              <InfoIcon className={classes.iconButton} />
            </Hover>
          </Typography>
        </Hidden>

        <Hidden smUp>
          <Typography
            variant="h5"
            align="center"
            className={`${classes[`${colorClass}Bar`]} ${classes.bar}`}
          >
            {name}
            <Hover>
              <InfoIcon className={classes.iconButton} />
            </Hover>
          </Typography>
          <Typography variant="h5" align="center">
            {formattedVal}
          </Typography>
          <Typography variant="h6" align="center" className={classes.rates}>
            {formattedSubVal}
            {' '}
            {subname}
          </Typography>
        </Hidden>
      </CardContent>
    </Card>
  );
};

const LocalStatsTable = ({
  data = {},
  getFlag = false,
  sources,
  level,
  mini = false,
  isMetro = false,
}) => {
  const classes = useStyles();
  const {
    confirmed = 0,
    deaths = 0,
    name = '',
    recovered = 0,
    hospitalized_currently: hospitalized = 0,
    active = 0,
    datetime: updated,
    population = 0,
    state_id: stateId,
  } = data;
  const lastUpdated = new Date(updated);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    // console.log(`%cStats Table render:${level}`, 'color: orange');
  });

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  let svgFlag = defaultFlag;

  if (getFlag) {
    const url = stateId ? `/us/${stateId.toLowerCase()}` : '/us';
    svgFlag = {
      backgroundImage: `linear-gradient(rgba(16, 16, 16, 0.9), rgba(16, 16, 16, 0.7)),
      url(${process.env.PUBLIC_URL}/static/img${url}.svg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  if (mini) {
    // mini stats view
    return (
      <Card style={svgFlag} variant="outlined" classes={{ root: isMetro ? classes.metro : '' }}>
        <CardHeader
          titleTypographyProps={{
            className: classes.title,
            variant: 'body1',
            component: 'span',
          }}
          title={`COVID-19 Data for ${name}`}
        />

        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} sm>
              <StatBlock
                mini={mini}
                name="Confirmed Cases"
                value={confirmed}
                colorClass="confirmed"
                subvalue={confirmed / population}
                level={level}
                description="Aggregated case count"
              />
            </Grid>
            <Grid item xs={6} sm>
              <StatBlock
                mini={mini}
                name="Deaths"
                value={deaths}
                colorClass="deaths"
                subvalue={deaths / population}
                level={level}
                description="Aggregated death toll"
              />
            </Grid>
            <Visible condition={recovered}>
              <Grid item xs={6} sm>
                <StatBlock
                  mini={mini}
                  name="Recoveries"
                  value={recovered}
                  colorClass="recovered"
                  subvalue={recovered / population}
                  level={level}
                  description="Aggregated recovered case count"
                />
              </Grid>
            </Visible>
            <Visible condition={hospitalized}>
              <Grid item xs={6} sm>
                <StatBlock
                  mini={mini}
                  name="Hospitalizations"
                  value={hospitalized}
                  colorClass="hospitalized"
                  subvalue={hospitalized / population}
                  level={level}
                  description={
                    level === 'usa'
                      ? 'Current number of people hospitalized totaled from reporting states'
                      : 'Current number of people hospitalized'
                  }
                />
              </Grid>
            </Visible>
            <Visible condition={active}>
              <Grid item xs={6} sm>
                <StatBlock
                  mini={mini}
                  name="Active Cases"
                  value={active}
                  colorClass="active"
                  subvalue={active / population}
                  level={level}
                  description="Aggregated confirmed cases that have not been resolved (active cases = total cases - total recovered - total deaths)"
                />
              </Grid>
            </Visible>
          </Grid>
          {!mini ? (
            <Grid container item xs={12} justify="space-between" style={{ paddingTop: '8px' }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  {lastUpdated.toString() !== 'Invalid Date'
                    ? `Last updated: ${lastUpdated.toLocaleString('en', {
                      timeStyle: 'long',
                      dateStyle: 'long',
                    })}`
                    : '---'}
                </Typography>
              </Grid>
              <Grid item xs>
                <Typography variant="body2" align="right">
                  <Button
                    component="button"
                    color="default"
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                  >
                    Data sources
                  </Button>
                </Typography>
              </Grid>
            </Grid>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={svgFlag} variant="outlined" classes={{ root: isMetro ? classes.metro : '' }}>
      <CardHeader
        titleTypographyProps={{
          className: classes.title,
        }}
        title={`COVID-19 Data for ${name}`}
        subheader={`Population: ${bigNumberFormat.format(population)}`}
        subheaderTypographyProps={{
          color: 'secondary',
          variant: 'h6',
          id: `${level}-population`,
        }}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm xl={4}>
            <StatBlock
              name="Confirmed Cases"
              value={confirmed}
              colorClass="confirmed"
              subvalue={confirmed / population}
              level={level}
              description="Aggregated case count"
            />
          </Grid>
          <Grid item xs={12} sm xl={4}>
            <StatBlock
              name="Deaths"
              value={deaths}
              colorClass="deaths"
              subvalue={deaths / population}
              level={level}
              description="Aggregated death toll"
            />
          </Grid>
          <Visible condition={recovered}>
            <Grid item xs={12} sm xl={4}>
              <StatBlock
                name="Recoveries"
                value={recovered}
                colorClass="recovered"
                subvalue={recovered / population}
                level={level}
                description="Aggregated recovered case count"
              />
            </Grid>
          </Visible>
          <Visible condition={hospitalized}>
            <Grid item xs={12} sm md>
              <StatBlock
                name="Current Hospitalized"
                value={hospitalized}
                colorClass="hospitalized"
                subvalue={hospitalized / population}
                level={level}
                description="Current number of people hospitalized"
              />
            </Grid>
          </Visible>
          <Visible condition={active}>
            <Grid item xs={12} sm md>
              <StatBlock
                name="Active Cases"
                value={active}
                colorClass="active"
                subvalue={active / population}
                level={level}
                description="Aggregated confirmed cases that have not been resolved (active cases = total cases - total recovered - total deaths)"
              />
            </Grid>
          </Visible>
        </Grid>
        <Grid container item xs={12} justify="space-between" style={{ paddingTop: '8px' }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">{updatedTimeFormat(lastUpdated)}</Typography>
          </Grid>
          <Grid item xs>
            <Typography variant="body2" align="right">
              <Button onClick={handleClick} style={{ cursor: 'pointer' }}>
                Data sources
              </Button>
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {sources.map((source) => (
          <ListItem key={source.url}>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              color="textSecondary"
              underline="always"
              href={source.url}
            >
              {source.name}
            </Link>
          </ListItem>
        ))}
      </Popover>
    </Card>
  );
};

export default LocalStatsTable;
