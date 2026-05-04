import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import Verify from './pages/Verify';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
