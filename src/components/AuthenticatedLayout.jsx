import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const AuthenticatedLayout = () => (
  <div className="bg-background text-on-background font-body-md w-full min-h-screen flex antialiased">
    <Sidebar />
    <main className="flex-1 md:ml-72 min-h-screen flex min-w-0 flex-col relative w-full overflow-x-hidden pb-24 md:pb-0">
      <Outlet />
    </main>
    <BottomNav />
  </div>
);

export default AuthenticatedLayout;
