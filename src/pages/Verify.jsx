import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthLayout from '../components/AuthLayout';
import { getApiErrorMessage } from '../utils/errors';

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('pendingEmail') || '';
    const stateEmail = location.state?.email || '';
    const notice = location.state?.notice || '';

    setEmail(stateEmail || storedEmail);
    if (notice) {
      setSuccess(notice);
    }
  }, [location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = { email: email.trim(), code: code.trim() };
      await API.post('/api/auth/verify', payload);
      setSuccess('Email verified. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', {
          state: {
            email: payload.email,
            notice: 'Verification complete. Please log in.',
          },
        });
      }, 600);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verification failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the code we sent to your inbox to finish setup."
      footer={
        <span>
          Need a new account?{' '}
          <Link className="text-primary font-semibold hover:underline" to="/signup">
            Sign up
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="text-label-md text-on-surface" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-surface-variant bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-label-md text-on-surface" htmlFor="code">
              Verification code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-2 w-full rounded-xl border border-surface-variant bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              placeholder="Enter 6 digit code"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-error/30 bg-error-container px-4 py-3 text-body-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-secondary/20 bg-secondary-container px-4 py-3 text-body-sm text-on-secondary-container">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary px-4 py-3 text-label-md text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Verifying...' : 'Verify email'}
        </button>
      </form>

      <div className="text-body-sm text-on-surface-variant">
        Did not receive the email? Check your spam folder or request a new code.
      </div>
    </AuthLayout>
  );
};

export default Verify;
