import React from 'react';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import LinearProgress from '@material-ui/core/LinearProgress';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import { makeStyles } from '@material-ui/core/styles';
import CardContent from '@material-ui/core/CardContent';
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
  title: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.4em',
    },
  },
}));

const Feed = ({ data }) => {
  const classes = useStyles();
  const { myState, headlines = [], loadingZip } = data;
  // show nothing if loaded without selected state
  if (!myState) return null;

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
        {headlines
          .sort(sortDate)
          .map(({ url: feedUrl = 'blank', created: createdDate, note }, index) => {
            const age = determineAge(createdDate);
            const isFresh = age <= daysStillFresh;
            const key = feedUrl + createdDate + note;
            // console.log(`%c${index}:${key}`, 'color: pink');
            return (
              <div>
                <Link
                  key={key}
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
                  {note}
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
      </CardContent>
    </Card>
  );
};

export default Feed;
