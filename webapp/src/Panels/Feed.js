import React, { useState } from 'react';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import { makeStyles } from '@material-ui/core/styles';
import CardContent from '@material-ui/core/CardContent';
import Visible from '../components/Visible';
import { sortDate, determineAge } from '../util/dates';
/*
  Displays State's Executive Orders from API.
  Objects newer than the 'daysStillFresh' are marked
*/

const daysStillFresh = 7;

const useStyles = makeStyles((theme) => ({
  url: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.2em',
    },
  },
  headline: {},
  bullet: {
    width: '35px',
    marginRight: '0px',
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center',
  },
  fresh: {
    color: 'white',
  },
  age: {
    textDecoration: 'none',
    display: 'inline-block',
    marginLeft: '10px',
    fontSize: '0.8em',
    opacity: 0.7,
  },
  title: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.4em',
    },
  },
}));

const Feed = ({ data }) => {
  const classes = useStyles();
  const { myState, headlines = [], loadingZip } = data;
  const headlinesByDate = headlines.sort(sortDate);
  const topHeadlines = headlinesByDate.slice(0, 5);
  const [showAll, setShowAll] = useState(false);
  const showButton = headlines.length > topHeadlines.length;

  const usedArray = showAll ? headlinesByDate : topHeadlines;
  const buttonText = showAll ? 'View Recent Orders' : 'View All Orders';
  // show nothing if loaded without selected state
  if (!myState || myState === 'US') return null;

  if (loadingZip) {
    return (
      <Card variant="outlined">
        <CardHeader
          title="COVID-19 Critical Executive Orders"
          titleTypographyProps={{
            className: classes.title,
          }}
        />
        <CardContent>
          <LinearProgress style={{ width: '100%' }} />
        </CardContent>
      </Card>
    );
  }

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
        {usedArray.map(({ url: feedUrl = 'blank', created: createdDate, note }) => {
          const age = Math.floor(determineAge(createdDate));
          const isFresh = age <= daysStillFresh;
          const key = feedUrl + createdDate + note;
          return (
            <div key={key}>
              <Link
                classes={{
                  root: classes.url,
                }}
                className={isFresh ? classes.fresh : ''}
                href={feedUrl}
                target="_blank"
                rel="noreferrer noopener"
                color="textSecondary"
                underline="always"
                display="block"
                noWrap
                variant="h6"
              >
                <span className={classes.bullet}>{isFresh ? '🆕' : '●'}</span>
                <span className={classes.headline}>{note}</span>
                <span className={classes.age}>{` ${age} days ago`}</span>
              </Link>
            </div>
          );
        })}
        {headlines.length < 1 ? (
          <Typography noWrap variant="h6">
            No Executive Orders for
            {' '}
            {myState}
            .
          </Typography>
        ) : null}
        <Visible condition={showButton}>
          <Button
            component="button"
            color="inherit"
            onClick={() => setShowAll(!showAll)}
            style={{
              marginLeft: '10px',
            }}
          >
            {buttonText}
          </Button>
        </Visible>

      </CardContent>
    </Card>
  );
};

export default Feed;
