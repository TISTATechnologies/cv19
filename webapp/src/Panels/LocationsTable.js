import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import Hidden from '@material-ui/core/Hidden';

import Link from '@material-ui/core/Link';

const enFormat = new Intl.NumberFormat('en', {});

const bigNumberFormat = (val) => {
  if (Number.isNaN(Number.parseFloat(val, 10))) return '--';
  if (!val) return '--';
  return enFormat.format(val);
};

const percentageFormat = (val) => {
  if (Number.isNaN(Number.parseFloat(val, 10))) return '--';
  if (!val && val !== 0) return '--';
  if (val === Infinity) return 'N/A';
  return new Intl.NumberFormat('en', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(val);
};

const growOrShrink = (val) => {
  if (val === Infinity) return '';
  return val <= 0 ? 'shrink' : 'growth';
};

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function createHref(row) {
  // return row.zip
  if (row.zip) {
    return `#/${row.zip}-${row.name
      .split(/ |,/)
      .filter((x) => x)
      .join('-')
      .toLowerCase()}`;
  }
  if (row.fips && row.fips !== '00000') return `#/fips-${row.fips}`;
  return '/#';
}
function showDelete(row) {
  return row.fips !== '00000';
}

const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: '1rem',
    [theme.breakpoints.down('sm')]: { fontSize: '0.8em' },
    [theme.breakpoints.down('xs')]: { fontSize: '0.7em' },
  },
  icon: {
    width: '48px',
    color: theme.palette.warning.light,
    fontSize: '0.8em',
    overflow: 'hidden',
  },
  tooltip: { fontSize: '0.8rem', backgroundColor: '#222' },
  linkButton: {
    textAlign: 'inherit',
    [theme.breakpoints.down('sm')]: { fontSize: '1em' },
  },
  confirmed: { color: theme.palette.grey[300] },
  active: { color: theme.palette.warning.light },
  deaths: { color: theme.palette.error.light },
  deleteButton: { color: theme.palette.error.light },
  recovered: { color: theme.palette.success.light },
  shrink: {
    color: theme.palette.success.main,
  },
  growth: { color: theme.palette.error.main, '&::before': { content: "'+'" } },
  shortLabel: {
    fontSize: '0.7em',
  },
  guide: {
    display: 'flex',
    textAlign: 'center',
    width: '100%',
    padding: theme.spacing(0, 1),
    alignContent: 'space-between',
    fontSize: '0.7rem',
    backgroundColor: '#333',
    borderRadius: '0 0 4px 4px',
  },
  metro: {
    color: theme.palette.warning.main,
  },
}));

const columnHeaders = [
  {
    label: 'Location',
    shortLabel: 'Location',
    numeric: false,
    id: 'name',
    visible: true,
  },
  {
    label: 'Confirmed',
    shortLabel: 'Cnf',
    numeric: true,
    id: 'confirmed',
    visible: true,
  },
  {
    label: 'Deaths',
    shortLabel: 'Dth',
    numeric: true,
    id: 'deaths',
    visible: true,
  },
  {
    label: 'Active',
    shortLabel: 'Act',
    numeric: true,
    id: 'active',
    visible: true,
  },
  {
    label: '2D',
    shortLabel: '2D',
    numeric: true,
    id: 'active_trend2',
    visible: false,
  },
  {
    label: '7D',
    shortLabel: '7D',
    numeric: true,
    id: 'active_trend7',
    visible: false,
  },
  {
    label: '1M',
    shortLabel: '1M',
    numeric: true,
    id: 'active_trend30',
    visible: false,
  },
  {
    label: '2M',
    shortLabel: '2M',
    numeric: true,
    id: 'active_trend60',
    visible: false,
  },
  {
    label: '3M',
    shortLabel: '3M',
    numeric: true,
    id: 'active_trend90',
    visible: false,
  },
  {
    label: 'Active/100K',
    shortLabel: 'A/100K',
    numeric: true,
    id: 'activeRatio',
    visible: true,
  },
  {
    label: '',
    shortLabel: '',
    numeric: false,
    id: 'delete',
    visible: true,
    classes: 'icon',
  },
];

export default function SimpleTable({
  data = [], addFunction, removeFunction, thisLocation,
}) {
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('activeRatio');

  const classes = useStyles();

  const handleRequestSort = (event, property) => {
    const shouldSetDesc = orderBy !== property || order === 'asc';
    setOrder(shouldSetDesc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler = (property) => (event) => {
    handleRequestSort(event, property);
  };

  const rows = data.map((d) => ({
    ...d,
    activeRatio: Math.ceil((d.active / d.population) * 1e5),
  }));

  const shouldShow = (val) => {
    if (!val) return false;
    if (Number.isNaN(val)) return false;
    if (val === Infinity) return false;
    return true;
  };

  rows.forEach((r) => {
    if (shouldShow(r.active_trend2)) columnHeaders[4].visible = true;
    if (shouldShow(r.active_trend7)) columnHeaders[5].visible = true;
    if (shouldShow(r.active_trend30)) columnHeaders[6].visible = true;
    if (shouldShow(r.active_trend60)) columnHeaders[7].visible = true;
    if (shouldShow(r.active_trend90)) columnHeaders[8].visible = true;
  });

  return (
    <Card variant="outlined">
      <CardHeader
        title="My Locations"
        titleTypographyProps={{
          className: classes.title,
        }}
        action={
          thisLocation.fips && thisLocation.fips !== '00000' ? (
            <IconButton color="secondary" size="small" onClick={() => addFunction(thisLocation)}>
              <Tooltip
                title={`Add ${thisLocation.name}`}
                classes={{ tooltip: classes.tooltip }}
                interactive
                placement="left"
              >
                <AddCircleIcon />
              </Tooltip>
            </IconButton>
          ) : null
        }
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table aria-label="my counties" size="small" classes={{ root: classes.root }}>
            <TableHead>
              <TableRow>
                {columnHeaders.map((headCell, i) => (headCell.visible ? (
                  <TableCell
                    scope={i === 0 ? 'row' : ''}
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={headCell.disablePadding ? 'none' : 'default'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    className={headCell.classes ? classes[headCell.classes] : ''}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'desc'}
                      onClick={createSortHandler(headCell.id)}
                    >
                      <Hidden smDown className="fullLabel">
                        {headCell.label}
                      </Hidden>
                      <Hidden mdUp className="shortLabel">
                        {headCell.shortLabel}
                      </Hidden>
                    </TableSortLabel>
                  </TableCell>
                ) : null))}
              </TableRow>
            </TableHead>

            <TableBody>
              {stableSort(rows, getComparator(order, orderBy)).map((row) => (
                <TableRow key={row.name}>
                  <TableCell component="th" scope="row" align="left">
                    <Link
                      color="textPrimary"
                      underline="always"
                      variant="body1"
                      classes={{ root: classes.linkButton }}
                      className={row.fips.includes('US') ? classes.metro : ''}
                      href={createHref(row)}
                    >
                      {`${row.name}`}
                    </Link>
                  </TableCell>
                  <TableCell align="right" className={classes.confirmed}>
                    {bigNumberFormat(row.confirmed)}
                  </TableCell>
                  <TableCell align="right" className={classes.deaths}>
                    {bigNumberFormat(row.deaths)}
                  </TableCell>
                  <TableCell align="right" className={classes.active}>
                    {bigNumberFormat(row.active)}
                  </TableCell>
                  {columnHeaders[4].visible ? (
                    <TableCell align="right" className={classes[growOrShrink(row.active_trend2)]}>
                      {`${percentageFormat(row.active_trend2)}`}
                    </TableCell>
                  ) : null}
                  {columnHeaders[5].visible ? (
                    <TableCell align="right" className={classes[growOrShrink(row.active_trend7)]}>
                      {`${percentageFormat(row.active_trend7)}`}
                    </TableCell>
                  ) : null}
                  {columnHeaders[6].visible ? (
                    <TableCell align="right" className={classes[growOrShrink(row.active_trend30)]}>
                      {`${percentageFormat(row.active_trend30)}`}
                    </TableCell>
                  ) : null}
                  {columnHeaders[7].visible ? (
                    <TableCell align="right" className={classes[growOrShrink(row.active_trend60)]}>
                      {`${percentageFormat(row.active_trend60)}`}
                    </TableCell>
                  ) : null}
                  {columnHeaders[8].visible ? (
                    <TableCell align="right" className={classes[growOrShrink(row.active_trend90)]}>
                      {`${percentageFormat(row.active_trend90)}`}
                    </TableCell>
                  ) : null}
                  <TableCell align="right" className={classes.active}>
                    {bigNumberFormat(row.activeRatio)}
                  </TableCell>
                  <TableCell>
                    {showDelete(row) ? (
                      <IconButton
                        classes={{
                          root: classes.deleteButton,
                        }}
                        size="small"
                        edge="end"
                        onClick={() => {
                          removeFunction(row.fips);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Hidden mdUp>
          <div className={classes.guide}>
            {columnHeaders.map((a) => (a.shortLabel !== a.label ? (
              <div key={a.shortLabel} style={{ flex: '1' }}>{`${a.shortLabel}: ${a.label} `}</div>
            ) : null))}
          </div>
        </Hidden>
      </CardContent>
    </Card>
  );
}
