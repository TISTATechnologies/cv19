import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';
import cyan from '@material-ui/core/colors/cyan';

const coreTheme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: { main: '#002E8C' },
    secondary: { main: cyan[500] },
  },
  spacing: 4,
  overrides: {
    MuiTable: {
      root: { backgroundColor: '#222222', fontSize: '1rem' },
    },
    MuiTableCell: {
      head: { fontWeight: '600' },
      root: { fontSize: 'inherit' },
      sizeSmall: {
        padding: '6px',
      },
    },
    MuiCard: {
      root: {
        height: '100%',
        transition: 'all 0.5s',
      },
    },
    MuiCardHeader: {
      root: {
        padding: '16px 16px 8px',
      },
    },
    MuiCardContent: {
      root: {
        padding: '8px 16px',
        '&:last-child': {
          paddingBottom: '8px',
        },
      },
    },
  },
});
const theme = responsiveFontSizes(coreTheme);
theme.gradients = {
  metro: `linear-gradient(120deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 20%, ${theme.palette.warning.main} 80%,  ${theme.palette.warning.dark} 100%)`,
};

export default theme;
