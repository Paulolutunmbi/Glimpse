import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import InputField from '../components/InputField';
import StatusMessage from '../components/StatusMessage';
import API from '../api/axios';
import { getApiErrorMessage } from '../utils/errors';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing. Use the link from your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await API.post('/api/auth/reset-password', { token, newPassword: password });
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 700);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      kicker="Choose a new password. Keep your account close."
      logoSizeClass="h-[192px]"
      sidebarLogoSizeClass="h-[168px]"
    >
      <section className="relative z-10 w-full max-w-[520px] rounded-2xl bg-surface-container-lowest p-lg shadow-[0_22px_45px_-30px_rgba(61,44,44,0.65)] sm:p-xl lg:p-xxl dark:bg-[#261817] dark:shadow-[0_22px_45px_-30px_rgba(0,0,0,0.9)]">
        <div className="mb-lg flex justify-center sm:justify-start lg:hidden">
          <img
            src="/images/glimpse-logo-light-dark.png"
            alt="Glimpse"
            className="h-[192px] w-auto object-contain"
          />
        </div>
        <div className="mb-xl">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-lg font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/35 focus:ring-offset-2 focus:ring-offset-surface-container-lowest dark:text-[#f7dcdb] dark:focus:ring-offset-[#261817]"
          >
            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5" aria-hidden="true">
              arrow_back
            </span>
            Back to login
          </Link>
        </div>

        <header className="mb-xl space-y-sm">
          <h1 className="font-h1 text-h2 text-on-surface sm:text-h1 dark:text-[#ffedeb]">
            Reset Password
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-[#f7dcdb]">
            Create a new password with at least 8 characters.
          </p>
        </header>

        <form className="space-y-lg" onSubmit={handleSubmit} noValidate>
          <InputField
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="New Password"
            icon="lock"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your new password"
            endAction={
              <button
                type="button"
                className="text-outline transition-colors hover:text-primary-container"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[20px]" data-icon="visibility">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            }
          />

          <InputField
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            icon="lock"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm your new password"
            endAction={
              <button
                type="button"
                className="text-outline transition-colors hover:text-primary-container"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <span className="material-symbols-outlined text-[20px]" data-icon="visibility">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            }
          />

          {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}

          <Button type="submit" loading={loading}>
            Reset Password
          </Button>
        </form>
      </section>
    </AuthLayout>
  );
};

export default ResetPassword;
