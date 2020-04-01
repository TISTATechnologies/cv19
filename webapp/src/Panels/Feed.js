import React from "react";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";
import LinearProgress from "@material-ui/core/LinearProgress";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import { makeStyles } from "@material-ui/core/styles";
import CardContent from "@material-ui/core/CardContent";

const useStyles = makeStyles((theme) => ({
  url: {
    [theme.breakpoints.down("xs")]: {
      fontSize: "1.2em",
    },
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
        <CardHeader title={`COVID-19 Critical Executive Orders`}
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
        {headlines.map((f) => (
          <Link
            className={classes.url}
            display="block"
            href={f.url}
            target="_blank"
            rel="noreferrer noopener"
            color="textSecondary"
            underline="always"
            noWrap
            key={f.url + f.created}
            variant="h6"
          >
            <li>{f.note}</li>
          </Link>
        ))}
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
