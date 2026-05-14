import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useUser } from './context/UserContext.jsx';
import AuthenticatedLayout from './components/AuthenticatedLayout.jsx';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import ProfileSetup from './pages/ProfileSetup';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import SavedMoments from './pages/SavedMoments';
import CreateMoment from './pages/CreateMoment';
import Reels from './pages/Reels';
import Messages from './pages/Messages';
import GroupChat from './pages/GroupChat';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';

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

const hasCompletedOnboarding = (user) => {
  if (!user) return false;
  if (typeof user.onboardingCompleted === 'boolean') return user.onboardingCompleted;
  if (user.profileCompleted) return true;
  return user.isFirstLogin === false;
};

const RequireOnboardingComplete = ({ children }) => {
  const { user, isLoading } = useUser();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasCompletedOnboarding(user)) return <Navigate to="/profile-setup" replace />;

  return children;
};

const RequireProfileSetup = ({ children }) => {
  const { user, isLoading } = useUser();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (hasCompletedOnboarding(user)) return <Navigate to="/" replace />;

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
        <Route path="/u/:username" element={<PublicProfile />} />
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
          element={
            <RequireAuth>
              <RequireOnboardingComplete>
                <AuthenticatedLayout />
              </RequireOnboardingComplete>
            </RequireAuth>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/saved" element={<SavedMoments />} />
          <Route path="/create" element={<CreateMoment />} />
          <Route path="/messages/group/:groupId" element={<GroupChat />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
