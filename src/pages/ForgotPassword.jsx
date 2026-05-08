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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    setError('');
    setSuccess(false);

    if (!trimmedEmail) {
      setError('Enter your email address.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword({ email: trimmedEmail });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to send reset link. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout logoSizeClass="h-[192px]" sidebarLogoSizeClass="h-[168px]">
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
            Forgot Password
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-[#f7dcdb]">
            Enter your email and we'll send you a reset link to regain access to your account.
          </p>
        </header>

        <form className="space-y-lg" onSubmit={handleSubmit} noValidate>
          <InputField
            id="email"
            name="email"
            type="email"
            label="Email Address"
            icon="mail"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            error={error}
          />

          <Button type="submit" loading={loading}>
            Send Reset Link
          </Button>

          {success ? (
            <StatusMessage tone="success">
              If an account exists, a reset link has been sent.
            </StatusMessage>
          ) : null}
        </form>

        <div className="mt-xl space-y-lg text-center">
          <StatusMessage tone="info">
            Check your spam folder if you don't see the email within a few minutes.
          </StatusMessage>

          <div className="border-t border-outline-variant pt-lg dark:border-[#654746]">
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-[#f7dcdb]">
              Still having trouble?
              <a
                className="ml-1 font-label-md text-label-md text-primary-container transition-colors hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary-container/35"
                href="mailto:support@glimpse.app"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </section>
    </AuthLayout>
  );
};

export default ForgotPassword;
