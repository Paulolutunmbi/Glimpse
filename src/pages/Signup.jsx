import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { getApiErrorMessage } from '../utils/errors';

const Signup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    <div className="w-full bg-background min-h-screen font-body-md text-on-surface antialiased overflow-x-hidden">
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="w-full md:w-1/2 lg:w-5/12 xl:w-1/3 p-margin_mobile md:p-margin_desktop lg:p-xxl flex flex-col justify-center bg-surface relative z-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-xl text-center md:text-left">
              <img
                src="/images/glimpse-logo.png"
                alt="Brand logo"
                className="mx-auto md:mx-0 h-10 w-auto"
              />
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
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-4 py-3 pl-12 text-on-surface font-body-md placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary-container transition-colors"
                    type="button"
                    aria-label="Show password"
                  >
                    <span className="material-symbols-outlined text-[20px]" data-icon="visibility">
                      visibility
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
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl px-4 py-3 pl-12 text-on-surface font-body-md placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all duration-200"
                    placeholder="••••••••"
                  />
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
                <span>© 2024</span>
                <img src="/images/glimpse-logo.png" alt="Brand logo" className="h-4 w-auto" />
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

        <div className="hidden md:block md:w-1/2 lg:w-7/12 xl:w-2/3 relative bg-surface-container-low p-md lg:p-lg">
          <div className="w-full h-full rounded-[32px] overflow-hidden relative shadow-[0_4px_30px_-4px_rgba(0,0,0,0.1)]">
            <img
              alt="Friends laughing"
              className="absolute inset-0 w-full h-full object-cover object-center"
              data-alt="A warm, brightly lit lifestyle photography collage featuring a diverse group of young adults laughing, taking candid photos, and enjoying a sunny afternoon. The scene exudes a minimalist, serene aesthetic with a soft color palette dominated by whites, light grays, and muted earth tones, accented by subtle touches of a vibrant coral red. The lighting is natural and high-key, creating a sense of joy and human connection typical of modern social media interfaces."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrGdIVpkEFwmPqgg7bH6KbYfS4_wRG9oqFIH1xFx39EN3RiAJAASVNoo-gXgKDYAHoHZ9DMOmIGHuIJmJVoXHf5vT_99nkDJqH7XBhEZEmHyRZ2B33DHQl9F0SCL_4H3Xa3Gnfia9FIOrHcj1w9_RVbZusof_FrwN4JZqldWAQMUmzHTsDHx3nvd4BsyJSSFPhXIzpVmVWySqI9Rry3QO51q2myz0GwFy5V3rrehCcOY2wbF_ln4eEz0yy1mIzmnAfUVDiTm7MBA"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent"></div>

            <div className="absolute bottom-12 left-12 right-12 text-on-primary">
              <h2 className="font-h1 text-h1 mb-sm drop-shadow-md">Capture the moment.</h2>
              <p className="font-body-lg text-body-lg opacity-90 max-w-md drop-shadow">
                Connect with friends, share your journey, and build a community around the things you love.
              </p>
            </div>

            <div className="absolute top-12 right-12 bg-surface-bright/80 backdrop-blur-md p-md rounded-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] flex items-center gap-md border border-white/20">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest">
                <img
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  data-alt="A close-up portrait of a cheerful young woman with natural sunlight highlighting her features, set against a soft, blurred background. The image has a clean, high-key lighting style consistent with a warm minimalist aesthetic, fitting seamlessly into a pristine, light-themed user interface."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlZnPTwBdUfPr1s47YwSc8IP8Tz4Te7GDAU26iuGHZ9VW_SB0-dM0BrNMHp1O5og78B74iyQBDLmm3IGaVr4_fl00iBqBwiHXhSLeXM7dw5K8JsPg23tN_jgUBdwXsvUqL_m2mLXvK7-CEOTS95ZrdoWQ5AFmpGgoGpmhrhSjmkoFwdhpOEZj2HKEp6nBdWHZ8GL_bJGI0AhdTXqvz3Mw3eNL6xy2Ib6Hv_UFsBWHiRrF1z_qQIeqibR-h2XEzWOOqJkJX5xX8fw"
                />
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface">Mia caught a glimpse</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-[16px] text-primary-container"
                    data-icon="favorite"
                    data-weight="fill"
                  >
                    favorite
                  </span>
                  Just now
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
