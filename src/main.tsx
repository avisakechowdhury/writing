import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import 'katex/dist/katex.min.css';

// ---------------------------------------------------------------
// Global error handlers — prevent unhandled rejections (e.g. from
// Socket.IO reconnect failures, network blips) from crashing the
// React tree through the ErrorBoundary.
// ---------------------------------------------------------------
window.addEventListener('unhandledrejection', (event) => {
  // Swallow "Loading chunk failed" errors — the ErrorBoundary's
  // chunk-load detection already handles these via a full reload.
  const reason = event.reason;
  const msg = reason?.message || String(reason);
  if (
    msg.includes('Loading chunk') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed')
  ) {
    event.preventDefault();
    window.location.reload();
    return;
  }
  // Log but don't crash — we're inside a SPA, crashing the whole
  // app is worse than silently logging the error.
  console.error('[WriteAnon] Unhandled promise rejection:', reason);
  event.preventDefault();
});

// ---------------------------------------------------------------
// Service Worker registration — wrapped defensively so failures
// (e.g. in Instagram WebView, restricted iframes) never propagate.
// ---------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed silently — push
        // notifications won't work, but the app remains functional.
      });
    } catch {
      // Synchronous throw from `register` (some older WebViews).
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
