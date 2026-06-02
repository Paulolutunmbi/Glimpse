import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/apiService';
import { getApiErrorMessage } from '../utils/errors';
import { useUser } from '../context/UserContext.jsx';

const desktopImage =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=85';

const mobileImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBoN-1zipTGXT_OhwPZHP6MqFs-uP9n0iKOFSwcn54rk2zab5dNcBWyVK5GXSLGD85GKN4dYwLfJ0BK2vPjBGetmUVloGX17zOSJQK_Dsh5qyexSmI8MZSDcDX_6Nzb34axEKaerHvtRwgY_lbmOSJPzJTsk20Qn_H1cLKgkQnzKUeieJbVYV8TsOy201YaxWOeNvYOm7WEEp0G6nb7tTMxQv5FVf7dzgQWU_mAqSiYR86l93j5b607gTIhlccPqW4jeELZ_s29mA';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginId, setLoginId] = useState(() => location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.notice || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setAuthToken, refreshUser } = useUser();
  const activityLabel = 'discover what your circle shared';
  const glimpseCountLabel = 'Fresh moments waiting';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = { identifier: loginId.trim(), password };
      const data = await authService.login(payload);
      const token = data?.token || data?.data?.token || data?.accessToken || data?.jwt;
      const redirectTo = data?.redirectTo || data?.data?.redirectTo || '/';

      if (token) {
        setAuthToken(token);
        await refreshUser();
      }

      setSuccess('Login successful. Redirecting...');
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 500);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-white">
      <main className="flex min-h-screen w-full flex-col min-[420px]:flex-row">
        <section className="relative h-[246px] w-full flex-shrink-0 overflow-hidden bg-surface-variant min-[420px]:hidden">
          <img
            src={mobileImage}
            alt="Happy people looking at phones"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </section>

        <section className="relative z-10 flex w-full flex-1 flex-col items-center justify-start border-t border-outline-variant/60 bg-background px-5 pb-8 pt-8 min-[420px]:w-1/2 min-[420px]:justify-center min-[420px]:border-t-0 min-[420px]:px-6 min-[420px]:pt-16 lg:px-12">
          <div className="w-full min-w-0 max-w-[360px] space-y-8 lg:max-w-[448px]">
            <div className="flex justify-center min-[420px]:justify-start">
                <img
                  src="/images/glimpse-logo-light-dark.png"
                  alt="Glimpse"
                  className="glimpse-logo-compact object-contain"
                />
            </div>
            <div className="space-y-2 text-center min-[420px]:text-left">
              <h1 className="font-h1 text-[24px] font-bold leading-tight tracking-[-0.02em] text-on-background md:text-h1">
                Welcome Back
              </h1>
              <p className="font-body-lg text-[16px] leading-snug text-on-surface-variant md:text-body-lg">
                Log in to catch up with your creative circle.
              </p>
            </div>

            <form className="mt-8 w-full space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="group relative">
                  <label
                    className="mb-1 block font-label-md text-label-md text-on-surface-variant"
                    htmlFor="email"
                  >
                    Username or Email
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-outline transition-colors group-focus-within:text-primary-container">
                      alternate_email
                    </span>
                    <input
                      id="email"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      required
                      value={loginId}
                      onChange={(event) => setLoginId(event.target.value)}
                      className="ambient-shadow block h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-2 font-body-md text-body-md text-on-background placeholder:text-outline-variant focus:border-primary-container focus:outline-none focus:ring-0"
                      placeholder="username or hello@example.com"
                    />
                  </div>
                </div>

                <div className="group relative">
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      className="block font-label-md text-label-md text-on-surface-variant"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <Link
                      className="font-label-sm text-label-sm text-primary-container transition-all hover:underline"
                      to="/forgot-password"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-outline transition-colors group-focus-within:text-primary-container">
                      lock
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="ambient-shadow block h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-12 font-body-md text-body-md text-on-background placeholder:text-outline-variant focus:border-primary-container focus:outline-none focus:ring-0"
                      placeholder="••••••••"
                    />
                    <button
                      className="absolute right-sm top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-primary-container"
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <span className="material-symbols-outlined text-[20px]" data-icon="visibility">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-secondary/20 bg-secondary-container px-4 py-3 font-body-sm text-body-sm text-on-secondary-container">
                  {success}
                </div>
              ) : null}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ambient-shadow flex h-12 w-full items-center justify-center gap-1 rounded-xl border-b-2 border-b-black/10 bg-[#FF5A5F] px-6 py-2 font-label-md text-label-md text-white transition-all hover:bg-[#E5484D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Logging in...' : 'Log In'}
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-outline-variant" />
                <span className="mx-4 flex-shrink-0 font-label-sm text-label-sm uppercase tracking-widest text-outline">
                  or
                </span>
                <div className="flex-grow border-t border-outline-variant" />
              </div>

              <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
                Don&apos;t have an account?
                <Link
                  className="ml-1 font-label-md text-label-md text-primary-container transition-all hover:underline"
                  to="/signup"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </section>

        <section className="relative hidden h-screen w-1/2 bg-[#fff3ef] p-md min-[420px]:block lg:p-lg">
          <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-surface-container-lowest shadow-[0_18px_55px_-24px_rgba(89,56,47,0.55)]">
            <img
              src={desktopImage}
              alt="Group of friends sharing photos together"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

            <div className="absolute left-4 right-4 top-4 flex min-h-[64px] items-center gap-3 rounded-2xl border border-white/35 bg-white/85 px-3 py-2 shadow-[0_18px_45px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md min-[900px]:left-auto min-[900px]:right-6 min-[900px]:top-6 min-[900px]:w-[240px] lg:right-10 lg:top-10">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-container shadow-sm">
                <img
                  src="/images/glimpse-icon.png"
                  alt="Glimpse"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-label-md text-label-md leading-tight text-on-surface">
                  {glimpseCountLabel}
                </p>
                <p className="truncate font-body-sm text-body-sm leading-tight text-on-surface-variant">
                  from your circle, {activityLabel}
                </p>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8 text-white lg:bottom-12 lg:left-12">
              <h2 className="mb-sm max-w-[520px] font-h1 text-h1 drop-shadow-md">
                Share the moments that matter.
              </h2>
              <p className="max-w-[420px] font-body-lg text-body-lg text-white/90 drop-shadow">
                Log back in to post, react, and catch up with the people behind every photo.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
