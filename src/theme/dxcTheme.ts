import { createTheme } from '@mui/material/styles';

const dxcTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4995FF',
      dark: '#004AAC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0E1020',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D14600',
    },
    warning: {
      main: '#FFAE41',
    },
    background: {
      default: '#F6F3F0',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0E1020',
      secondary: '#4995FF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    },
    h2: {
      fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    },
    h3: {
      fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
    h4: {
      fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
    h5: {
      fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
    h6: {
      fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 400,
      letterSpacing: 0,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 400,
    },
    button: {
      fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    overline: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    },
    caption: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 24,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '100px',
          padding: '10px 24px',
          fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          backgroundColor: '#0E1020',
          color: '#FFFFFF',
          '&:hover': { backgroundColor: '#004AAC' },
        },
        containedSecondary: {
          backgroundColor: '#4995FF',
          color: '#FFFFFF',
          '&:hover': { backgroundColor: '#004AAC' },
        },
        outlined: {
          borderColor: '#0E1020',
          color: '#0E1020',
          '&:hover': { borderColor: '#4995FF', color: '#4995FF' },
        },
        outlinedPrimary: {
          borderColor: '#4995FF',
          color: '#4995FF',
          '&:hover': { borderColor: '#004AAC', color: '#004AAC' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(14,16,32,0.08)',
          border: '1px solid rgba(14,16,32,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 700,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          fontSize: '0.68rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0E1020',
          boxShadow: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F6F3F0',
          '& .MuiTableCell-head': {
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            fontSize: '0.72rem',
            color: '#0E1020',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '100px',
          backgroundColor: '#A1E6FF',
          height: 6,
        },
        bar: {
          backgroundColor: '#4995FF',
          borderRadius: '100px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            '&:hover fieldset': { borderColor: '#4995FF' },
            '&.Mui-focused fieldset': { borderColor: '#4995FF' },
          },
          '& label.Mui-focused': { color: '#4995FF' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: '12px',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid rgba(14,16,32,0.08)',
          borderRadius: '12px !important',
          '&:before': { display: 'none' },
          marginBottom: '8px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          fontSize: '0.75rem',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
          fontSize: '0.8rem',
          letterSpacing: '0.01em',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});

// Brand color constants for use throughout the app
export const DXC = {
  midnightBlue: '#0E1020',
  white: '#FFFFFF',
  canvas: '#F6F3F0',
  trueBlue: '#4995FF',
  royalBlue: '#004AAC',
  sky: '#A1E6FF',
  gold: '#FFAE41',
  peach: '#FFC982',
  melon: '#FF7E51',
  red: '#D14600',
  // Touch level colors
  stp: '#16a34a',
  lowTouch: '#4995FF',
  moderateTouch: '#FFAE41',
  highTouch: '#D14600',
} as const;

export default dxcTheme;
