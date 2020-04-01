import React from "react";

const Visible = ({ condition, children }) => {
  if (condition) return <>{children}</>;
  return null;
};

export default Visible;
