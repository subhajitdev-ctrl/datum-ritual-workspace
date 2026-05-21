import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker dynamically based on current deployment path immediately
if ('serviceWorker' in navigator) {
  const base = window.location.pathname.endsWith('/') 
    ? window.location.pathname 
    : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  
  const swUrl = `${base}sw.js`;
  
  navigator.serviceWorker.register(swUrl, { scope: base })
    .then((reg) => {
      console.log('DATUM Service Worker registered from bundle with scope:', reg.scope);
    })
    .catch((err) => {
      console.warn('DATUM Service Worker bundle registration failed:', err);
    });
}

