import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { OrganizationProvider } from './context/OrganizationContext';
import { SiteSkeletonTheme } from './components/ui/skeletons';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Fetched once here; every component below reads it from context. */}
      <OrganizationProvider>
        {/* One set of shimmer colours for every loading placeholder in the app. */}
        <SiteSkeletonTheme>
          <App />
        </SiteSkeletonTheme>
      </OrganizationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
