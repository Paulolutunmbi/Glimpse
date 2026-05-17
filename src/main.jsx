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
    navigator.serviceWorker.register('/sw.js').catch(() => null);
  });
}
