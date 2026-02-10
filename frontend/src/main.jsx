import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Cache busting - force refresh on version change
const APP_VERSION = '2.1.0'; // Update this with each deployment
const STORED_VERSION = localStorage.getItem('app_version');

if (STORED_VERSION && STORED_VERSION !== APP_VERSION) {
  console.log(`Version updated from ${STORED_VERSION} to ${APP_VERSION} - clearing cache`);
  localStorage.setItem('app_version', APP_VERSION);

  // Clear service worker cache if exists
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }

  // Force hard reload
  window.location.reload(true);
} else if (!STORED_VERSION) {
  localStorage.setItem('app_version', APP_VERSION);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
