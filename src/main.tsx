import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { deviceHeartbeatManager } from './lib/device/deviceHeartbeat';

// Start atomic multi-platform device heartbeat & network status detection
deviceHeartbeatManager.start();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
