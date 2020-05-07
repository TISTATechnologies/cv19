import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import Link from "@material-ui/core/Link";

const enFormat = new Intl.NumberFormat("en", {});

const format = (val) => {
  if (Number.isNaN(Number.parseFloat(val, 10))) return "--";
  if (!val) return "--";
  return enFormat.format(val);
};

const useStyles = makeStyles((theme) => ({
  root: {
    // minWidth: 650,
    fontSize: "1.2rem",
    backgroundColor: "#222",
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
}));

export default function SimpleTable({
  data = [],
  addFunction,
  removeFunction,
  thisLocation,
  navigate,
}) {
  const classes = useStyles();
  const rows = data;
  return (
    <Card variant="outlined">
      <CardHeader
        title={`My Tracked Counties`}
        titleTypographyProps={{
          className: classes.title,
        }}
        action={
          thisLocation.fips ? (
            <Button
              color="secondary"
              // variant="outlined"
              // size="small"
              onClick={() => addFunction(thisLocation.fips)}
            >{`Add ${thisLocation.location_name}`}</Button>
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
                <TableCell>County</TableCell>
                <TableCell align="right">Confirmed</TableCell>
                <TableCell align="right">Deaths</TableCell>
                <TableCell align="right">Active</TableCell>
                <TableCell align="right">Recoveries</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.location_name}>
                  <TableCell component="th" scope="row">
                    <Link
                      color="textPrimary"
                      underline="always"
                      component="button"
                      variant="body1"
                      onClick={() => {
                        navigate(row.fips);
                      }}
                    >
                      {row.location_name}
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
                  <TableCell align="right" className={classes.recovered}>
                    {format(row.recovered)}
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
