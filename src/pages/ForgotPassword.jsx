import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import InputField from '../components/InputField';
import StatusMessage from '../components/StatusMessage';
import { authService } from '../services/apiService';
import { getApiErrorMessage } from '../utils/errors';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    setError('');
    setSuccess(false);

    if (!trimmedUsername) {
      setError('Enter your username.');
      return;
    }

    if (!trimmedEmail) {
      setError('Enter the email on your account.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword({
        username: trimmedUsername,
        email: trimmedEmail,
        newPassword: password,
      });
      setSuccess(true);
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to reset password. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout logoSizeClass="glimpse-logo-compact" sidebarLogoSizeClass="glimpse-logo">
      <section className="relative z-10 w-full max-w-[520px] rounded-2xl bg-surface-container-lowest p-lg shadow-[0_22px_45px_-30px_rgba(61,44,44,0.65)] sm:p-xl lg:p-xxl dark:bg-[#261817] dark:shadow-[0_22px_45px_-30px_rgba(0,0,0,0.9)]">
        <div className="mb-lg flex justify-center sm:justify-start lg:hidden">
          <img
            src="/images/glimpse-logo-light-dark.png"
            alt="Glimpse"
            className="glimpse-logo object-contain"
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
            Forgot Password
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-[#f7dcdb]">
            Confirm your account details and choose a new password.
          </p>
        </header>

        <form className="space-y-lg" onSubmit={handleSubmit} noValidate>
          <InputField
            id="username"
            name="username"
            type="text"
            label="Username"
            icon="person"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="username"
          />

          <InputField
            id="email"
            name="email"
            type="email"
            label="Account Email"
            icon="mail"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            error={error}
          />

          <InputField
            id="newPassword"
            name="newPassword"
            type="password"
            label="New Password"
            icon="lock"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />

          <Button type="submit" loading={loading}>
            Reset Password
          </Button>

          {success ? (
            <StatusMessage tone="success">
              Password updated. You can now log in.
            </StatusMessage>
          ) : null}
        </form>
      </section>
    </AuthLayout>
  );
};

export default ForgotPassword;
