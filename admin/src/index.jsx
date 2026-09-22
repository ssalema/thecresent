import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { OrganizationProvider } from './context/OrganizationContext';
import { AdminSkeletonTheme } from './components/ui/skeletons';

// Importing lib/api.js anywhere installs the shared client's interceptors:
// every request carries the session token, and any 401 is a trip back to the
// login screen. OrganizationProvider below is the first thing to use it.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Fetched once here; every page below reads it from context. */}
      <OrganizationProvider>
        {/* One set of shimmer colours for every loading placeholder in the panel. */}
        <AdminSkeletonTheme>
          <App />
        </AdminSkeletonTheme>
      </OrganizationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
