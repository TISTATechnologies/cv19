import React from "react";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";
import LinearProgress from "@material-ui/core/LinearProgress";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import { makeStyles } from "@material-ui/core/styles";
import CardContent from "@material-ui/core/CardContent";

const daysStillFresh = 7;

const sortDate = (a, b) => {
  const aDate = Date.parse(a.created);
  const bDate = Date.parse(b.created);
  return bDate - aDate;
};

const daysDiff = (date1, date2) => {
  const toDays = (dt) => dt / (1000 * 60 * 60 * 24);
  return Math.abs(toDays(date1) - toDays(date2));
};

const myAge = (date) => {
  const d = Date.parse(date);
  return daysDiff(d, Date.now());
};

const useStyles = makeStyles((theme) => ({
  url: {
    [theme.breakpoints.down("xs")]: {
      fontSize: "1.2em",
    },
  },
  bullet: {
    width: "35px",
    marginRight: "0px",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
  },
  fresh: {
    color: "white",
  },
  title: {
    [theme.breakpoints.down("xs")]: {
      fontSize: "1.4em",
    },
  },
}));

const Feed = ({ data }) => {
  const classes = useStyles();
  const { myState, headlines = [], loadingZip } = data;
  if (loadingZip)
    return (
      <Card variant="outlined">
        <CardHeader
          title={`COVID-19 Critical Executive Orders`}
          titleTypographyProps={{
            className: classes.title,
          }}
        />
        <CardContent>
          <LinearProgress style={{ width: "100%" }} />
        </CardContent>
      </Card>
    );
  if (!myState) return null;
  return (
    <Card variant="outlined">
      <CardHeader
        title={`COVID-19 Critical Executive Orders for ${myState}`}
        titleTypographyProps={{
          className: classes.title,
        }}
        subheader="The most important executive orders for this state:"
      />
      <CardContent>
        {headlines.sort(sortDate).map((f) => {
          const age = myAge(f.created);
          const isFresh = age <= daysStillFresh;
          return (
            <div>
            <Link
              key={f.url + f.created}
              classes={{
                root: classes.url,
              }}
              className={isFresh ? classes.fresh : ""}
              href={f.url}
              target="_blank"
              rel="noreferrer noopener"
              color="textSecondary"
              underline="always"
              display="block"
              noWrap
              variant="h6"
            >
              <span className={classes.bullet}>{isFresh ? "🆕" : "●"}</span>
              {f.note}
            </Link>
            </div>
          );
        })}
        {headlines.length < 1 ? (
          <Typography noWrap variant="h6">
            No Executive Orders for {myState}.
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default Feed;
