import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Paper from "@material-ui/core/Paper";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import AddCircleIcon from "@material-ui/icons/AddCircle";

import Link from "@material-ui/core/Link";

const enFormat = new Intl.NumberFormat("en", {});

const format = (val) => {
  if (Number.isNaN(Number.parseFloat(val, 10))) return "--";
  if (!val) return "--";
  return enFormat.format(val);
};

const percentage = (val) => {
  if (Number.isNaN(Number.parseFloat(val, 10))) return "--";
  if (!val) return "---";
  return new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(val);
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
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const useStyles = makeStyles((theme) => ({
  root: { fontSize: "1.2rem" },
  tooltip: { fontSize: "0.8rem", backgroundColor: "#222" },
  linkButton: {
    textAlign: "inherit",
  },
  confirmed: { color: theme.palette.grey[300] },
  active: { color: theme.palette.warning.light },
  deaths: { color: theme.palette.error.light },
  recovered: { color: theme.palette.success.light },
  confirmedBar: {
    backgroundColor: theme.palette.grey[700],
    color: "#222",
  },
  activeBar: {
    backgroundColor: theme.palette.warning.main,
    color: "#222",
  },
  deathsBar: {
    backgroundColor: theme.palette.error.main,
    color: "#222",
  },
  recoveredBar: {
    backgroundColor: theme.palette.success.main,
    color: "#222",
  },
  shrink: {
    color: theme.palette.success.main,
  },
  growth: { color: theme.palette.error.main,
    "&::before": { content: "'+'" },
   },
  compact: { fontSize: "0.8em" },
}));

const headers = [
  { label: "County", numeric: false, id: "name", visible: true },
  { label: "Confirmed", numeric: true, id: "confirmed", visible: true },
  { label: "Deaths", numeric: true, id: "deaths", visible: true },
  { label: "Active", numeric: true, id: "active", visible: true },
  {
    label: "Active +/-2day",
    numeric: true,
    id: "active_trend2",
    visible: false,
    classes: "compact",
  },
  {
    label: "Active +/-Week",
    numeric: true,
    id: "active_trend7",
    visible: false,
    classes: "compact",
  },
  {
    label: "Active +/-1Mth",
    numeric: true,
    id: "active_trend30",
    visible: false,
    classes: "compact",
  },
  {
    label: "Active +/-3Mths",
    numeric: true,
    id: "active_trend90",
    visible: false,
    classes: "compact",
  },
  { label: "Active/100k", numeric: true, id: "activeRatio", visible: true },
];

export default function SimpleTable({
  data = [],
  addFunction,
  removeFunction,
  thisLocation,
  navigate,
}) {
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("activeRatio");

  const classes = useStyles();

  const handleRequestSort = (event, property) => {
    const shouldSetDesc = orderBy !== property || order === "asc";
    console.log(shouldSetDesc);
    setOrder(shouldSetDesc ? "desc" : "asc");
    setOrderBy(property);
  };

  const createSortHandler = (property) => (event) => {
    handleRequestSort(event, property);
  };

  const rows = data.map((d) => ({
    ...d,
    activeRatio: Math.ceil((d.active / d.population) * 1e5),
  }));

  rows.forEach((r) => {
    if (r.active_trend2) headers[4].visible = true;
    if (r.active_trend7) headers[5].visible = true;
    if (r.active_trend30) headers[6].visible = true;
    if (r.active_trend90) headers[7].visible = true;
  });

  return (
    <Card variant="outlined">
      <CardHeader
        title={`My Counties`}
        titleTypographyProps={{
          className: classes.title,
        }}
        action={
          thisLocation.fips ? (
            <IconButton
              color="secondary"
              // size="small"
              onClick={() => addFunction(thisLocation.fips)}
            >
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
          <Table
            aria-label="simple table"
            size="small"
            classes={{ root: classes.root }}
          >
            <TableHead>
              <TableRow>
                {headers.map((headCell) =>
                  headCell.visible ? (
                    <TableCell
                      key={headCell.id}
                      align={headCell.numeric ? "right" : "left"}
                      padding={headCell.disablePadding ? "none" : "default"}
                      sortDirection={orderBy === headCell.id ? order : false}
                      className={
                        headCell.classes ? classes[headCell.classes] : ""
                      }
                    >
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : "desc"}
                        onClick={createSortHandler(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ) : null
                )}
                <TableCell />
              </TableRow>
            </TableHead>

            <TableBody>
              {stableSort(rows, getComparator(order, orderBy)).map((row) => (
                <TableRow key={row.name}>
                  <TableCell component="th" scope="row" align="left">
                    <Link
                      color="textPrimary"
                      underline="always"
                      component="button"
                      variant="body1"
                      classes={{ button: classes.linkButton }}
                      onClick={() => {
                        navigate(row.fips);
                      }}
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell align="right" className={classes.confirmed}>
                    {format(row.confirmed)}
                  </TableCell>
                  <TableCell align="right" className={classes.deaths}>
                    {format(row.deaths)}
                  </TableCell>
                  <TableCell align="right" className={classes.active}>
                    {format(row.active)}
                  </TableCell>
                  {headers[4].visible ? (
                    <TableCell
                      align="right"
                      className={
                        row.active_trend2 < 0
                          ? classes.shrink
                          : classes.growth
                      }
                    >
                      {`${percentage(row.active_trend2)}`}
                    </TableCell>
                  ) : null}
                  {headers[5].visible ? (
                    <TableCell
                      align="right"
                      className={
                        row.active_trend7 < 0
                          ? classes.shrink
                          : classes.growth
                      }
                    >
                      {`${percentage(row.active_trend7)}`}
                    </TableCell>
                  ) : null}
                  {headers[6].visible ? (
                    <TableCell
                      align="right"
                      className={
                        row.active_trend30 < 0
                          ? classes.shrink
                          : classes.growth
                      }
                    >
                      {`${percentage(row.active_trend30)}`}
                    </TableCell>
                  ) : null}
                  {headers[7].visible ? (
                    <TableCell
                      align="right"
                      className={
                        row.active_trend90 < 0
                          ? classes.shrink
                          : classes.growth
                      }
                    >
                      {`${percentage(row.active_trend90)}`}
                    </TableCell>
                  ) : null}
                  <TableCell align="right" className={classes.active}>
                    {format(row.activeRatio)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      className={classes.deaths}
                      onClick={() => {
                        removeFunction(row.fips);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
