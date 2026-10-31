// resources/js/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { registerServiceWorker } from './lib/offline/registerSW';
import { startSyncEngine } from './lib/offline/sync';

const csrfToken = document
  .querySelector('meta[name="csrf-token"]')
  ?.getAttribute('content');
if (csrfToken) {
  (window as any).__csrfToken = csrfToken;
}

if (import.meta.env.PROD) {
  registerServiceWorker();
}

startSyncEngine();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);