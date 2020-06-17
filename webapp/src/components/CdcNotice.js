import React, { useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import CloseIcon from '@material-ui/icons/Close';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Link from '@material-ui/core/Link';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Visible from './Visible';

import useLocalStorage from '../util/useLocalStorage';

const useStyles = makeStyles((theme) => ({
  noteCard: {
    backgroundColor: theme.palette.warning.dark,
  },
}));

const CdcNotice = () => {
  const classes = useStyles();
  const [localNoticeOpen, setLocalNoticeOpen] = useLocalStorage(
    'showCDC',
    true,
  );
  const [noticeOpen, setNoticeOpen] = useState(localNoticeOpen);

  useEffect(() => {
    setLocalNoticeOpen(noticeOpen);
  }, [noticeOpen, setLocalNoticeOpen]);

  return (
    <Visible condition={noticeOpen}>
      <Grid item xs={12} sm={8}>
        <ListItem className={classes.noteCard}>
          <ListItemText variant="h6" component="p" align="center">
            NOTE: New CDC guidance could cause an increase in the number of
            deaths attributed to COVID-19.
            {' '}
            <Link
              href="https://www.cdc.gov/nchs/data/nvss/coronavirus/Alert-2-New-ICD-code-introduced-for-COVID-19-deaths.pdf"
              target="_blank"
              rel="noopener noreferrer"
              color="textSecondary"
              underline="always"
            >
              See this report for more details.
            </Link>
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
