import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/i18n';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { LookupProvider } from './lib/lookupContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LookupProvider>
        <App />
      </LookupProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
