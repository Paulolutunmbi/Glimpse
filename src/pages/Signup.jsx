import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthLayout from '../components/AuthLayout';
import { getApiErrorMessage } from '../utils/errors';

const Signup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = { username: username.trim(), email: email.trim(), password };
      await API.post('/api/auth/register', payload);
      localStorage.setItem('pendingEmail', payload.email);
      setSuccess('Account created. Redirecting to verification...');
      setTimeout(() => {
        navigate('/verify', {
          state: {
            email: payload.email,
            notice: 'Account created. Enter the verification code we sent.',
          },
        });
      }, 600);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Signup failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Glimpse to share updates and keep your circle close."
      footer={
        <span>
          Already verified?{' '}
          <Link className="text-primary font-semibold hover:underline" to="/login">
            Log in
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="text-label-md text-on-surface" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-xl border border-surface-variant bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              placeholder="Your display name"
            />
          </div>

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
            <label className="text-label-md text-on-surface" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-surface-variant bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              placeholder="Create a strong password"
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
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="text-body-sm text-on-surface-variant">
        By creating an account, you agree to our terms and privacy policy.
      </div>
    </AuthLayout>
  );
};

export default Signup;
