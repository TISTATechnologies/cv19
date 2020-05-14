import { createMuiTheme, responsiveFontSizes } from "@material-ui/core/styles";
import cyan from "@material-ui/core/colors/cyan";

let theme = createMuiTheme({
  palette: {
    type: "dark",
    primary: { main: "#002E8C" },
    secondary: { main: cyan[500] },
  },
  spacing: 8,
  overrides: {
    MuiTable: {
      root: { backgroundColor: "#222222", fontSize: "1rem" },
    },
    MuiTableCell: {
      head: { fontWeight: "600" },
      root: { fontSize: "inherit" },
      sizeSmall: {
        padding: '6px', 
      },
    },
    MuiCard: {
      root: {
        height: "100%",
      },
    },
    MuiCardHeader: {
      root: {
        padding: "16px 16px 8px",
      },
    },
    MuiCardContent: {
      root: {
        padding: "8px 16px",
        "&:last-child": {
          paddingBottom: "8px",
        },
      },
    },
  },
});
theme = responsiveFontSizes(theme);

export default theme;
