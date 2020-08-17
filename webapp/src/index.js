import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import loadConfig from './util/loadConfig';

import './index.css';

// After config file is loaded, then render the app
loadConfig(() => {
  const Main = React.lazy(() => import('./Main'));
  ReactDOM.render(
    <React.StrictMode>
      <Suspense fallback={<div />}>
        <Main />
      </Suspense>
    </React.StrictMode>,
    document.getElementById('root'),
  );
});
