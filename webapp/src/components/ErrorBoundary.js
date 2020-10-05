/* eslint-disable no-unused-vars */
import React from 'react';

/*
  Taken straight from https://reactjs.org/docs/error-boundaries.html
*/

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    // console.log(error, errorInfo);
  }

  render() {
    const { hasError } = this.state;
    if (hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }
    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;
