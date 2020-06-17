import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { useServiceWorker } from '../util/useServiceWorker';

const useStyles = makeStyles((theme) => ({
  noteCard: {
    backgroundColor: theme.palette.warning.dark,
  },
}));

const Refresher = () => {
  const classes = useStyles();
  const { isUpdateAvailable, updateAssets } = useServiceWorker();
  return (
    <Snackbar
      open={isUpdateAvailable}
      onClose={updateAssets}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <SnackbarContent
        variant="elevation"
        message="A new version of this app is ready."
        className={classes.snackbarRefresh}
        action={(
          <Button color="secondary" size="small" onClick={updateAssets}>
            REFRESH
          </Button>
        )}
      />
    </Snackbar>
  );
};

export default Refresher;
