import React from "react";
import App from "./App";
import CssBaseline from "@material-ui/core/CssBaseline";

import { ThemeProvider } from "@material-ui/core/styles";
import { HashRouter as Router } from "react-router-dom";
import theme from "./util/theme";

const Main = () => (
  <Router>
    <ThemeProvider theme={theme}>
    <CssBaseline />
      <App />
    </ThemeProvider>
  </Router>
);

export default Main;
