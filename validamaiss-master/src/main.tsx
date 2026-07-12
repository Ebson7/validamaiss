import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = createRoot(document.getElementById('root')!);

// Load the application (and the heavy Firebase/data layer it pulls in) as a
// dynamic chunk. This keeps Firebase out of the entry bundle, so the static
// HTML loading shell paints immediately instead of waiting for ~500 kB of
// Firebase to download and parse first.
import('./App.tsx').then(({ default: App }) => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
