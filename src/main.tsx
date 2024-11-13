import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

import App from './App';
import './index.css';

// This should be your actual manifest URL
const manifestUrl =
  'https://raw.githubusercontent.com/veebull/twa-manifest-json/refs/heads/main/tonconnect-manifest.json';

// Configure options for TonConnect
const manifestConfiguration = {
  manifestUrl,
  uiPreferences: {
    theme: 'SYSTEM',
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </StrictMode>
);
