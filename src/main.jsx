import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { UserProvider } from './context/UserContext.jsx';

createRoot(document.getElementById('root')).render(
  <UserProvider>
    <App />
  </UserProvider>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const showUpdateToast = (registration) => {
      if (document.getElementById('pwa-update-toast')) return;

      const toast = document.createElement('div');
      toast.id = 'pwa-update-toast';
      toast.setAttribute('role', 'status');
      toast.style.position = 'fixed';
      toast.style.right = '16px';
      toast.style.bottom = '16px';
      toast.style.zIndex = '9999';
      toast.style.background = '#111827';
      toast.style.color = '#ffffff';
      toast.style.padding = '12px 14px';
      toast.style.borderRadius = '12px';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.25)';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '10px';
      toast.style.fontFamily = 'system-ui, -apple-system, Segoe UI, sans-serif';
      toast.style.fontSize = '13px';

      const label = document.createElement('span');
      label.textContent = 'Update available';

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Reload';
      button.style.background = '#f59e0b';
      button.style.color = '#111827';
      button.style.border = 'none';
      button.style.borderRadius = '8px';
      button.style.padding = '6px 10px';
      button.style.fontWeight = '600';
      button.style.cursor = 'pointer';

      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.textContent = '×';
      dismiss.style.background = 'transparent';
      dismiss.style.color = '#9ca3af';
      dismiss.style.border = 'none';
      dismiss.style.fontSize = '16px';
      dismiss.style.cursor = 'pointer';

      dismiss.addEventListener('click', () => toast.remove());
      button.addEventListener('click', () => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          window.location.reload();
        }
      });

      toast.appendChild(label);
      toast.appendChild(button);
      toast.appendChild(dismiss);
      document.body.appendChild(toast);
    };

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        let refreshing = false;

        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdateToast(registration);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(registration);
            }
          });
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      })
      .catch(() => null);
  });
}
