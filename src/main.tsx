import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import dxcTheme from './theme/dxcTheme';
import { CaseProvider } from './context/CaseContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={dxcTheme}>
        <CssBaseline />
        <CaseProvider>
          <App />
        </CaseProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
