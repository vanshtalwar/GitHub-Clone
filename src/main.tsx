import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
import { pruneCache } from './api/cache';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Housekeeping off the critical path: drop expired and old-version cache entries.
(window.requestIdleCallback ?? ((callback: () => void) => setTimeout(callback, 2000)))(() => pruneCache());
