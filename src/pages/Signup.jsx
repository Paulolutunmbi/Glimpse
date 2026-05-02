import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { getApiErrorMessage } from '../utils/errors';

const signupPhotos = {
  left:
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=720&q=85',
  center:
    'https://unsplash.com/photos/Ib0KLrAfb-E/download?force=true&w=720',
  right:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=720&q=85',
  avatar:
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=85',
};

const Signup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const payload = { username: username.trim(), email: email.trim(), password };
      await API.post('/api/auth/register', payload);
      localStorage.setItem('pendingEmail', payload.email);
      setSuccess('Account created. We sent a verification code to your email.');
      setTimeout(() => {
        navigate('/verify', {
          state: {
            email: payload.email,
            notice: 'Account created. Enter the verification code we sent to your email.',
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
    <div className="w-full bg-background min-h-screen font-body-md text-on-surface antialiased overflow-x-hidden">
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="w-full md:w-1/2 lg:w-5/12 xl:w-1/3 p-margin_mobile md:p-margin_desktop lg:p-xxl flex flex-col justify-center bg-surface relative z-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]">
          <div className="mx-auto w-full max-w-[384px]">
            <div className="mb-xl text-center md:text-left">
              <div className="flex justify-center min-[420px]:justify-start">
                <img
                  src="/images/glimpse-logo-light-dark.png"
                  alt="Glimpse"
                  className="h-[200px] w-auto"
                />
              </div>
              <h2 className="font-h2 text-h2 text-on-surface mb-xs mt-sm">Create your account</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Join the conversation and start sharing.
              </p>
            </div>

            <form className="space-y-md" onSubmit={handleSubmit}>
              <div>
                <label
                  className="block font-label-sm text-label-sm text-on-surface-variant mb-unit ml-unit"
                  htmlFor="username"
                >
                  Username
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]"
                    data-icon="person"
                    data-weight="fill"
                  >
                    person
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-4 py-3 pl-12 text-on-surface font-body-md placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all duration-200"
                    placeholder="e.g. wanderlust24"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block font-label-sm text-label-sm text-on-surface-variant mb-unit ml-unit"
                  htmlFor="email"
                >
                  Email
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]"
                    data-icon="mail"
                    data-weight="fill"
                  >
                    mail
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-4 py-3 pl-12 text-on-surface font-body-md placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all duration-200"
                    placeholder="hello@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block font-label-sm text-label-sm text-on-surface-variant mb-unit ml-unit"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]"
                    data-icon="lock"
                    data-weight="fill"
                  >
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-4 py-3 pl-12 pr-12 text-on-surface font-body-md placeholder:text-outline-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary-container transition-colors"
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

              <div>
                <label
                  className="block font-label-sm text-label-sm text-on-surface-variant mb-unit ml-unit"
                  htmlFor="confirm_password"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]"
                    data-icon="lock_check"
                    data-weight="fill"
                  >
                    lock
                  </span>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-4 py-3 pl-12 pr-12 text-on-surface font-body-md placeholder:text-outline-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary-container transition-colors"
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                  >
                    <span className="material-symbols-outlined text-[20px]" data-icon="visibility">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label
                    className="block font-label-sm text-label-sm text-on-surface-variant mb-unit ml-unit"
                    htmlFor="dob"
                  >
                    Date of Birth
                  </label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    value={dob}
                    onChange={(event) => setDob(event.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-4 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all duration-200"
                  />
                </div>
                <div>
                  <label
                    className="block font-label-sm text-label-sm text-on-surface-variant mb-unit ml-unit"
                    htmlFor="gender"
                  >
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      name="gender"
                      value={gender}
                      onChange={(event) => setGender(event.target.value)}
                      className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-4 py-3 pr-10 text-on-surface font-body-md appearance-none focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all duration-200"
                    >
                      <option value="">Select...</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                    <span
                      className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                      data-icon="expand_more"
                    >
                      expand_more
                    </span>
                  </div>
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

              <div className="pt-sm">
                <button
                  className="w-full bg-primary-container text-on-primary font-label-md py-4 rounded-xl border-b-[2px] border-[#d4484d] hover:bg-[#ff474d] active:scale-[0.98] active:border-b-0 active:translate-y-[2px] transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_20px_-4px_rgba(255,90,95,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating account...' : 'Sign Up'}
                  <span className="material-symbols-outlined text-[20px]" data-icon="arrow_forward">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>

            <div className="mt-lg text-center">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Already have an account?
                <Link
                  className="font-label-md text-label-md text-primary-container hover:underline underline-offset-4 ml-1"
                  to="/login"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          <div className="hidden md:block absolute bottom-8 left-8 text-on-surface-variant opacity-70">
            <div className="flex gap-6 items-center font-label-sm text-label-sm tracking-wide">
              <div className="flex items-center gap-2">
                <span>(c) 2026 Glimpse</span>
                <img src="/images/glimpse-logo-light-dark.png" alt="Glimpse" className="h-4 w-auto" />
              </div>
              <a className="hover:text-primary-container transition-colors duration-200" href="#">
                Privacy
              </a>
              <a className="hover:text-primary-container transition-colors duration-200" href="#">
                Terms
              </a>
              <a className="hover:text-primary-container transition-colors duration-200" href="#">
                Cookies
              </a>
            </div>
          </div>
        </div>

        <div className="hidden md:block md:w-1/2 lg:w-7/12 xl:w-2/3 relative bg-[#fff3ef] p-md lg:p-lg">
          <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-[#f7987d] shadow-[0_18px_50px_-20px_rgba(91,48,35,0.45)]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#ffa387] via-[#f59a80] to-[#8f5d50]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_34%,rgba(255,255,255,0.18),transparent_34%)]" />

            <div className="absolute left-1/2 top-[48%] h-[44%] w-[66%] max-w-[680px] -translate-x-1/2 -translate-y-1/2">
              <article className="absolute left-0 top-[18%] h-[70%] w-[36%] overflow-hidden rounded-xl bg-white shadow-[0_18px_48px_-24px_rgba(42,27,22,0.7)]">
                <img
                  alt="Friends relaxing outdoors"
                  className="h-[84%] w-full object-cover"
                  src={signupPhotos.left}
                />
                <div className="flex h-[16%] items-center justify-center bg-white">
                  <span className="material-symbols-outlined text-[18px] text-outline-variant">crop_square</span>
                </div>
              </article>

              <article className="absolute right-0 top-[18%] h-[70%] w-[36%] overflow-hidden rounded-xl bg-white shadow-[0_18px_48px_-24px_rgba(42,27,22,0.7)]">
                <img
                  alt="Diverse friends smiling together"
                  className="h-[84%] w-full object-cover"
                  src={signupPhotos.right}
                />
                <div className="flex h-[16%] items-center justify-center bg-white">
                  <span className="material-symbols-outlined text-[18px] text-outline-variant">radio_button_unchecked</span>
                </div>
              </article>

              <article className="absolute left-1/2 top-0 z-10 h-full w-[44%] min-w-[250px] -translate-x-1/2 overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_70px_-28px_rgba(42,27,22,0.75)]">
                <div className="flex h-[14%] items-start justify-between px-5 pt-4">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-on-surface" />
                    <span className="h-1.5 w-1.5 rounded-full bg-on-surface" />
                    <span className="h-1.5 w-1.5 rounded-full bg-on-surface" />
                  </div>
                  <span className="h-2 w-3 rounded-sm bg-on-surface" />
                </div>
                <div className="space-y-5 px-5 pb-5">
                  <div className="h-2 w-16 rounded-full bg-surface-container-highest" />
                  <div className="flex items-center justify-between border-y border-outline-variant/50 py-3">
                    <span className="h-2 w-20 rounded-full bg-surface-container-highest" />
                    <span className="h-2 w-24 rounded-full bg-surface-container-highest" />
                    <span className="material-symbols-outlined text-[17px] text-outline">settings</span>
                  </div>
                  <img
                    alt="Diverse friends sharing a candid selfie"
                    className="aspect-[1.35] w-full rounded-sm object-cover"
                    src={signupPhotos.center}
                  />
                  <div className="flex items-center justify-center gap-8 text-outline">
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                    <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </div>
                </div>
              </article>
            </div>

            <div className="absolute right-8 top-8 flex items-center gap-md rounded-xl border border-white/40 bg-white/75 p-md shadow-[0_18px_50px_-26px_rgba(42,27,22,0.65)] backdrop-blur-md lg:right-12 lg:top-12">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-surface-container-highest">
                <img
                  alt="Mia smiling"
                  className="h-full w-full object-cover"
                  src={signupPhotos.avatar}
                />
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface">Mia caught a glimpse</p>
                <p className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary-container">favorite</span>
                  Just now
                </p>
              </div>
            </div>

            <div className="absolute bottom-10 left-8 right-8 text-white lg:bottom-12 lg:left-12">
              <h2 className="mb-sm font-h1 text-h1 drop-shadow-md">Capture the moment.</h2>
              <p className="max-w-[448px] font-body-lg text-body-lg drop-shadow">
                Connect with friends, share your journey, and build a community around the things you love.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
