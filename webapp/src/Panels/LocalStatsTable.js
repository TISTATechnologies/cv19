import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';

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
  confirmed: { color: theme.palette.grey[500], backgroundColor: '#222' },
  active: { color: theme.palette.warning.main, backgroundColor: '#222' },
  deaths: { color: theme.palette.error.main, backgroundColor: '#222' },
  recovered: { color: theme.palette.success.main, backgroundColor: '#222' },
  title: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.2em',
    },
  },
  bar: {
    margin: '0 -16px',
    color: '#222',
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
}));

const bigNumberFormat = new Intl.NumberFormat('en', {});
const updatedTimeFormat = (date) => (date.toString() !== 'Invalid Date'
  ? `Last updated: ${date.toLocaleDateString('en', {
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

  if (mini) {
    return (
      <Card className={`${classes[colorClass]}`} id={`${level}-${colorClass}`}>
        <Typography
          variant="h5"
          align="center"
          id={`${level}-${colorClass}-value`}
          className={`${classes[`${colorClass}Bar`]} ${classes.bar}`}
        >
          {formattedVal}
        </Typography>
      </Card>
    );
  }

  return (
    <Card
      className={`${classes.statGridBlock} ${classes[colorClass]}`}
      id={`${level}-${colorClass}`}
    >
      <CardContent>
        <Hidden only="xs">
          <Typography variant="h3" align="center" id={`${level}-${colorClass}-value`}>
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
          </Typography>
        </Hidden>

        <Hidden smUp>
          <Typography
            variant="h5"
            align="center"
            className={`${classes[`${colorClass}Bar`]} ${classes.bar}`}
          >
            {name}
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
  data = {}, getFlag = false, sources, level, mini = false,
}) => {
  const classes = useStyles();
  const {
    confirmed = 'N/A',
    deaths = 'N/A',
    name = '',
    recovered = 'N/A',
    active = 'N/A',
    datetime: updated,
    population = 'N/A',
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
      <Card style={svgFlag} variant="outlined">
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
            <Grid item xs={6} sm={3}>
              <StatBlock
                mini={mini}
                name="Confirmed Cases"
                value={confirmed}
                colorClass="confirmed"
                subvalue={confirmed / population}
                level={level}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatBlock
                mini={mini}
                name="Deaths"
                value={deaths}
                colorClass="deaths"
                subvalue={deaths / population}
                level={level}
              />
            </Grid>
            <Visible condition={active}>
              <Grid item xs={6} sm={3}>
                <StatBlock
                  mini={mini}
                  name="Active Cases"
                  value={active}
                  colorClass="active"
                  subvalue={active / population}
                  level={level}
                />
              </Grid>
            </Visible>
            <Visible condition={recovered}>
              <Grid item xs={6} sm={3}>
                <StatBlock
                  mini={mini}
                  name="Recoveries"
                  value={recovered}
                  colorClass="recovered"
                  subvalue={recovered / population}
                  level={level}
                />
              </Grid>
            </Visible>
          </Grid>
          {!mini ? (
            <Grid container item xs={12} justify="space-between" style={{ paddingTop: '8px' }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  {lastUpdated.toString() !== 'Invalid Date'
                    ? `Last updated: ${lastUpdated.toLocaleDateString('en', {
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
    <Card style={svgFlag} variant="outlined">
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
          <Grid item xs={12} sm>
            <StatBlock
              name="Confirmed Cases"
              value={confirmed}
              colorClass="confirmed"
              subvalue={confirmed / population}
              level={level}
            />
          </Grid>
          <Grid item xs={12} sm>
            <StatBlock
              name="Deaths"
              value={deaths}
              colorClass="deaths"
              subvalue={deaths / population}
              level={level}
            />
          </Grid>
          <Visible condition={active}>
            <Grid item xs={12} sm>
              <StatBlock
                name="Active Cases"
                value={active}
                colorClass="active"
                subvalue={active / population}
                level={level}
              />
            </Grid>
          </Visible>
          <Visible condition={recovered}>
            <Grid item xs={12} sm>
              <StatBlock
                name="Recoveries"
                value={recovered}
                colorClass="recovered"
                subvalue={recovered / population}
                level={level}
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
