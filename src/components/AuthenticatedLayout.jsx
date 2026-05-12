import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import StatusMessage from './StatusMessage';

const AuthenticatedLayout = () => {
  const location = useLocation();
  const [accessAlert, setAccessAlert] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('accessAlert');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setAccessAlert(parsed);
      sessionStorage.removeItem('accessAlert');
      const timer = setTimeout(() => setAccessAlert(null), 6000);
      return () => clearTimeout(timer);
    } catch {
      sessionStorage.removeItem('accessAlert');
    }
  }, [location.key]);

  return (
    <div className="bg-background text-on-background font-body-md w-full min-h-screen flex antialiased">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col relative w-full">
        {accessAlert ? (
          <div className="fixed top-20 left-1/2 z-50 w-[min(520px,90vw)] -translate-x-1/2">
            <StatusMessage tone="error">
              {accessAlert.message}{' '}
              {typeof accessAlert.attemptsRemaining === 'number'
                ? `${accessAlert.attemptsRemaining} attempts remaining before automatic ban.`
                : ''}
            </StatusMessage>
          </div>
        ) : null}
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AuthenticatedLayout;
