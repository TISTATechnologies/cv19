import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider } from "@material-ui/core/styles";
import { HashRouter as Router } from "react-router-dom";
import App from "./App";

import theme from "./util/theme";
import {
  ServiceWorkerProvider,
  useServiceWorker,
} from "./util/useServiceWorker";

const Main = (props) => {
  // :O

  return (
    <ServiceWorkerProvider>
      <Router>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App {...props} />
        </ThemeProvider>
      </Router>
    </ServiceWorkerProvider>
  );
};

export default Main;
