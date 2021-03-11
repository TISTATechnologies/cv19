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
import HelpIcon from '@material-ui/icons/Help';
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
    fontSize: 15,
    '&::before': {
      backgroundColor: '#222',
      border: '2px solid',
    },
  },
  confirmedArrow: { '&::before': { borderColor: theme.palette.grey[500] } },
  activeArrow: { '&::before': { borderColor: theme.palette.warning.main } },
  deathsArrow: { '&::before': { borderColor: theme.palette.error.main } },
  recoveredArrow: { '&::before': { borderColor: theme.palette.success.main } },
  hospitalizedArrow: { '&::before': { borderColor: theme.palette.info.main } },
  vaccineArrow: { '&::before': { borderColor: theme.palette.pink.main } },

  infoButton: {
    color: '#222',
    cursor: 'pointer',
    transform: 'translateY(2px)',
    // padding: '0.1em'
  },
  confirmed: { color: theme.palette.grey[500], backgroundColor: '#222' },
  active: { color: theme.palette.warning.main, backgroundColor: '#222' },
  deaths: { color: theme.palette.error.main, backgroundColor: '#222' },
  recovered: { color: theme.palette.success.main, backgroundColor: '#222' },
  hospitalized: { color: theme.palette.info.main, backgroundColor: '#222' },
  vaccine: { color: theme.palette.pink.main, backgroundColor: '#222' },
  confirmedBorder: { border: '2px solid', borderColor: theme.palette.grey[500] },
  activeBorder: { border: '2px solid', borderColor: theme.palette.warning.main },
  deathsBorder: { border: '2px solid', borderColor: theme.palette.error.main },
  recoveredBorder: { border: '2px solid', borderColor: theme.palette.success.main },
  hospitalizedBorder: { border: '2px solid', borderColor: theme.palette.info.main },
  vaccineBorder: { border: '2px solid', borderColor: theme.palette.pink.main },
  title: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.2em',
    },
  },
  bar: {
    margin: '0 -16px',
    color: '#222',
    position: 'relative',
    width: 'auto',
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
  vaccineBar: {
    backgroundColor: theme.palette.pink.main,
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
const percentFormat = new Intl.NumberFormat('en', { style: 'percent', minimumFractionDigits: 2 });
const updatedTimeFormat = (date) => (date.toString() !== 'Invalid Date'
  ? `Last updated: ${date.toLocaleString('en', {
    timeStyle: 'short',
    dateStyle: 'long',
  })}`
  : '---');

const formatVal = (value) => {
  if (Number.isNaN(value) || value === null) {
    return 'N/A';
  }
  if (typeof value === 'number') {
    return bigNumberFormat.format(value);
  }
  return value;
};

const formatSubVal = (subvalue) => {
  if (Number.isNaN(subvalue) || subvalue === null) {
    return 'N/A';
  }
  if (typeof subvalue === 'number') {
    return bigNumberFormat.format(Math.ceil(subvalue * 1e5));
  }
  return subvalue;
};

const createExtraList = ({
  vaccinationDistributed,
  vaccine,
  vaccinationAdmDose1,
  vaccinationAdmDose2,
  population,
}) => {
  const supplyPercent = vaccine / vaccinationDistributed;
  const singlePer = vaccinationAdmDose1 / population;
  const doublePer = vaccinationAdmDose2 / population;
  return (
    <>
      <Typography variant="h6">Vax Stats</Typography>
      <Grid container>
        <Grid item xs={8}>
          {'● Doses Distributed: '}
        </Grid>
        <Grid item xs={4}>{`${formatVal(vaccinationDistributed)}`}</Grid>
        <Grid item xs={8}>
          {'● Percent of Supply Used: '}
        </Grid>
        <Grid item xs={4}>{`${percentFormat.format(supplyPercent)}`}</Grid>
        <Grid item xs={8}>
          {'● People with 1+ Dose: '}
        </Grid>
        <Grid item xs={4}>{`${formatVal(vaccinationAdmDose1)}`}</Grid>
        <Grid item xs={8}>
          {'○ per 100,000: '}
        </Grid>
        <Grid item xs={4}>{`(${formatSubVal(singlePer)})`}</Grid>
        <Grid item xs={8}>
          {'● People with 2 Doses: '}
        </Grid>
        <Grid item xs={4}>{`${formatVal(vaccinationAdmDose2)}`}</Grid>
        <Grid item xs={8}>
          {'○ per 100,000: '}
        </Grid>
        <Grid item xs={4}>{`(${formatSubVal(doublePer)})`}</Grid>
      </Grid>
    </>
  );
};

const Hover = ({
  children, placement = 'left', title, colorClass = '',
}) => {
  const classes = useStyles();
  return (
    <Tooltip
      enterTouchDelay={100}
      interactive
      leaveDelay={500}
      arrow
      title={title}
      classes={{
        tooltip: `${classes.tooltip} ${classes[`${colorClass}Border`]}`,
        arrow: `${classes.arrow} ${classes[`${colorClass}Arrow`]}`,
      }}
      placement={placement}
    >
      {children}
    </Tooltip>
  );
};

const MiniStatBlock = ({
  value = 'N/A', colorClass = '', level = 'x', description = '',
}) => {
  const classes = useStyles();
  return (
    <Hover placement="bottom" title={description} colorClass={colorClass}>
      <Card className={`${classes[colorClass]}`} id={`${level}-${colorClass}`}>
        <Typography
          variant="h6"
          align="center"
          id={`${level}-${colorClass}-value`}
          className={`${classes[`${colorClass}Bar`]} ${classes.bar}`}
        >
          {formatVal(value)}
        </Typography>
      </Card>
    </Hover>
  );
};

const StatBlock = ({
  name,
  value = 'N/A',
  subname = 'per 100k',
  subvalue = 'N/A',
  colorClass = '',
  level = 'x',
  description = '',
  extra = null,
}) => {
  const classes = useStyles();

  return (
    <Card
      className={`${classes.statGridBlock} ${classes[colorClass]}`}
      id={`${level}-${colorClass}`}
    >
      <CardContent>
        <Hidden only="xs">
          <Typography variant="h4" align="center" id={`${level}-${colorClass}-value`}>
            {formatVal(value)}
          </Typography>
          <Typography
            variant="h6"
            align="center"
            className={classes.rates}
            id={`${level}-${colorClass}-rate`}
          >
            {formatSubVal(subvalue)}
            {' '}
            {subname}
          </Typography>
          <Grid container spacing={0} className={`${classes[`${colorClass}Bar`]} ${classes.bar}`}>
            <Grid item xs={1}>
              <Hover title={description} colorClass={colorClass} placement="right">
                <HelpIcon className={classes.infoButton} />
              </Hover>
            </Grid>

            <Grid item xs>
              <Typography variant="h5" align="center">
                {name}
              </Typography>
            </Grid>

            <Grid item xs={1}>
              {extra ? (
                <Hover title={extra} colorClass={colorClass} placement="left">
                  <InfoIcon className={classes.infoButton} />
                </Hover>
              ) : null}
            </Grid>
          </Grid>
        </Hidden>

        <Hidden smUp>
          <Grid container spacing={0} className={`${classes[`${colorClass}Bar`]} ${classes.bar}`}>
            <Grid item xs>
              <Hover title={description} colorClass={colorClass} placement="right">
                <HelpIcon className={classes.infoButton} />
              </Hover>
            </Grid>

            <Grid item xs={9}>
              <Typography variant="h5" align="center" style={{ fontSize: '1.4rem' }}>
                {name}
              </Typography>
            </Grid>

            <Grid item xs>
              {extra ? (
                <Hover title={extra} colorClass={colorClass} placement="left">
                  <InfoIcon className={classes.infoButton} />
                </Hover>
              ) : null}
            </Grid>
          </Grid>
          <Typography variant="h5" align="center">
            {formatVal(value)}
          </Typography>
          <Typography variant="h6" align="center" className={classes.rates}>
            {formatSubVal(subvalue)}
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
    vaccination_distributed: vaccinationDistributed = 0,
    vaccination_administered: vaccine = 0,
    vaccination_adm_dose1: vaccinationAdmDose1 = 0,
    vaccination_adm_dose2: vaccinationAdmDose2 = 0,
    datetime: updated,
    population = 0,
    state_id: stateId,
  } = data;

  const extraData = {
    vaccinationDistributed,
    vaccine,
    vaccinationAdmDose1,
    vaccinationAdmDose2,
    population,
  };

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
              <MiniStatBlock
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
              <MiniStatBlock
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
                <MiniStatBlock
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
            <Visible condition={hospitalized && level !== 'usa'}>
              <Grid item xs={6} sm>
                <MiniStatBlock
                  mini={mini}
                  name="Hospitalizations"
                  value={hospitalized}
                  colorClass="hospitalized"
                  subvalue={hospitalized / population}
                  level={level}
                  description="Current number of people hospitalized"
                />
              </Grid>
            </Visible>
            <Visible condition={vaccine}>
              <Grid item xs={6} sm>
                <MiniStatBlock
                  mini={mini}
                  name="Vaccinations"
                  value={vaccine}
                  colorClass="vaccine"
                  subvalue={vaccine / population}
                  level={level}
                  description="Current number of vaccine doses administered"
                />
              </Grid>
            </Visible>
            <Visible condition={active}>
              <Grid item xs={6} sm>
                <MiniStatBlock
                  mini={mini}
                  name="Active Cases"
                  value={active}
                  colorClass="active"
                  subvalue={active / population}
                  level={level}
                  description={(
                    <>
                      <div>Aggregated confirmed cases that have not been resolved</div>
                      <div>(active cases = total cases - total recovered - total deaths)</div>
                    </>
                  )}
                />
              </Grid>
            </Visible>
          </Grid>
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
          <Visible condition={hospitalized && level !== 'usa'}>
            <Grid item xs={12} sm md>
              <StatBlock
                name="Hospitalized"
                value={hospitalized}
                colorClass="hospitalized"
                subvalue={hospitalized / population}
                level={level}
                description="Current number of people hospitalized"
              />
            </Grid>
          </Visible>
          <Visible condition={vaccine && (level === 'state' || level === 'usa')}>
            <Grid item xs={12} sm md>
              <StatBlock
                name="Vax Doses Given"
                value={vaccine}
                colorClass="vaccine"
                subvalue={vaccine / population}
                level={level}
                description="Current number of  vaccine doses administered"
                extra={createExtraList(extraData)}
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
                description={(
                  <>
                    <div>Aggregated confirmed cases that have not been resolved</div>
                    <div>(active cases = total cases - total recovered - total deaths)</div>
                  </>
                )}
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
