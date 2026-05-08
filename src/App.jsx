import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useUser } from './context/UserContext.jsx';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import Verify from './pages/Verify';

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-on-background">
    Loading...
  </div>
);

const RequireAuth = ({ children }) => {
  const { user, isLoading } = useUser();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const RequireProfileComplete = ({ children }) => {
  const { user, isLoading } = useUser();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.profileCompleted) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

const RequireProfileSetup = ({ children }) => {
  const { user, isLoading } = useUser();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user?.profileCompleted) return <Navigate to="/profile" replace />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/profile-setup"
          element={
            <RequireAuth>
              <RequireProfileSetup>
                <ProfileSetup />
              </RequireProfileSetup>
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <RequireProfileComplete>
                <Home />
              </RequireProfileComplete>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <RequireProfileComplete>
                <Profile />
              </RequireProfileComplete>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <RequireProfileComplete>
                <Settings />
              </RequireProfileComplete>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
