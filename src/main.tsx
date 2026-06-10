import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './pwa/registerServiceWorker.ts';
import { selectManifest } from './pwa/selectManifest.ts';
import { preparePublicComplexRoutes, PublicComplexRouteBridge } from './components/PublicComplexRouteBridge.tsx';

await preparePublicComplexRoutes();
selectManifest();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PublicComplexRouteBridge />
  </StrictMode>,
);

registerServiceWorker();
