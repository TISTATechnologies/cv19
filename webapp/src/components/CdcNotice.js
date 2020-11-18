import React, { useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import CloseIcon from '@material-ui/icons/Close';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import NewReleasesIcon from '@material-ui/icons/NewReleases';

import Link from '@material-ui/core/Link';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Visible from './Visible';

import useLocalStorage from '../util/useLocalStorage';

const useStyles = makeStyles((theme) => ({
  noteCard: {
    color: '#222222',
    backgroundColor: theme.palette.warning.dark,
    // backgroundImage: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
    backgroundImage: theme.gradients.metro,
  },
  link: {
    color: '#222222',
    '&:hover': { color: '#fff', backgroundColor: theme.palette.warning.dark },
  },
}));

const CdcNotice = ({ zones = [] }) => {
  const classes = useStyles();
  const [localNoticeOpen, setLocalNoticeOpen] = useLocalStorage('learnMetro', true);
  const [noticeOpen, setNoticeOpen] = useState(localNoticeOpen);

  useEffect(() => {
    setLocalNoticeOpen(noticeOpen);
  }, [noticeOpen, setLocalNoticeOpen]);

  return (
    <Visible condition={noticeOpen}>
      <Grid item xs={12} sm={8}>
        <ListItem className={classes.noteCard}>
          <ListItemIcon>
            <NewReleasesIcon style={{ color: '#222' }} fontSize="large" />
          </ListItemIcon>
          <ListItemText variant="h6" component="p" align="center">
            {'Select metropolitan area statistics are now available! '}
            {zones.map((zone, index) => (
              <span key={zone.name}>
                {index === zones.length - 1 ? '& ' : ''}
                <Link
                  href={`/#/fips-${zone.fips}`}
                  rel="noopener noreferrer"
                  underline="always"
                  classes={{
                    root: classes.link,
                  }}
                >
                  {zone.short_name}
                </Link>
                {index === zones.length - 1 ? '.' : ', '}
              </span>
            ))}
          </ListItemText>
          <ListItemIcon>
            <IconButton onClick={() => setNoticeOpen(false)}>
              <CloseIcon />
            </IconButton>
          </ListItemIcon>
        </ListItem>
      </Grid>
    </Visible>
  );
};

export default CdcNotice;
