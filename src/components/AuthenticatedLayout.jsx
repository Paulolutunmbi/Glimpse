import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const AuthenticatedLayout = () => (
  <div className="bg-background text-on-background font-body-md w-full min-h-screen flex antialiased">
    <Sidebar />
    <main className="flex-1 md:ml-72 min-h-screen flex flex-col relative w-full">
      <Outlet />
    </main>
    <BottomNav />
  </div>
);

export default AuthenticatedLayout;
