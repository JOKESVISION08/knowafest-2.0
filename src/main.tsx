import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update on launch and periodic checks
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New update detected! Activating...');
    updateSW(true);
  },
  onRegisteredSW(swUrl, r) {
    if (r) {
      // Check for updates every 5 minutes in background
      setInterval(() => {
        r.update().catch((err) => console.debug('Periodic SW update check:', err));
      }, 5 * 60 * 1000);

      // When user re-opens or switches back to the installed mobile app, check immediately
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          r.update().catch((err) => console.debug('Visibility SW update check:', err));
        }
      });
    }
  },
});

createRoot(document.getElementById('root')!).render(<App />);
