import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsService, userService } from '../services/apiService';
import { getApiErrorMessage } from '../utils/errors';

const SUPPORT_EMAIL = 'oluwatunmbipaul@gmail.com';

const Settings = () => {
  const navigate = useNavigate();
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    allowMessages: 'followers',
    allowTagging: 'followers',
    activityVisibility: 'followers',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await settingsService.getSettings();
        const settings = response?.data?.settings || response?.settings;
        if (!settings || !isMounted) return;
        setPrivacy((prev) => ({ ...prev, ...(settings.privacy || {}) }));
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load settings.'));
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const settingsResponse = await settingsService.updateSettings({
        privacy,
      });

      if (settingsResponse?.data?.settings || settingsResponse?.settings) {
        setSuccess('Settings saved successfully.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update settings.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await userService.sendPasswordResetEmail();
      setSuccess(response?.message || 'Reset link sent to your email.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send reset email.'));
    }
  };

  const handleLogoutOthers = async () => {
    const confirmed = window.confirm(
      'Are you sure? This will sign out all other devices using your account.'
    );
    if (!confirmed) return;

    setError('');
    setSuccess('');
    setIsLoggingOutOthers(true);
    try {
      const response = await settingsService.logoutOtherSessions();
      const message = response?.message || 'Logged out of other sessions.';
      setSuccess(message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to logout other devices.'));
    } finally {
      setIsLoggingOutOthers(false);
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'This action is permanent. Do you want to contact support to delete your account?'
    );
    if (!confirmed) return;

    const subject = encodeURIComponent('Delete my Glimpse account');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
  };


  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 font-['Plus_Jakarta_Sans']">
          <div />
          <div className="flex items-center gap-4">
            <button
              className="rounded-full p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-50 hover:text-[#FF5A5F]"
              type="button"
              aria-label="Back to profile"
              onClick={() => navigate('/profile')}
            >
              <span className="material-symbols-outlined text-[#FF5A5F]">arrow_back</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-margin_mobile pb-24 pt-24 md:px-margin_desktop md:pb-10">
        <div className="mb-xl">
          <h1 className="font-h1 text-h1 text-on-surface">Settings</h1>
          <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
            Manage privacy, security, and authentication.
          </p>
        </div>

        <form className="space-y-lg" onSubmit={handleSubmit}>
          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-sm font-h3 text-h3 text-on-surface">Privacy</h2>
            <div className="grid gap-md md:grid-cols-2">
              <div>
                <label className="mb-xs block font-label-md text-label-md text-on-surface-variant">
                  Profile visibility
                </label>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 font-body-md text-body-md"
                  value={privacy.profileVisibility}
                  onChange={(event) =>
                    setPrivacy((prev) => ({ ...prev, profileVisibility: event.target.value }))
                  }
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="mb-xs block font-label-md text-label-md text-on-surface-variant">
                  Who can message you
                </label>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 font-body-md text-body-md"
                  value={privacy.allowMessages}
                  onChange={(event) =>
                    setPrivacy((prev) => ({ ...prev, allowMessages: event.target.value }))
                  }
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers</option>
                  <option value="none">No one</option>
                </select>
              </div>
              <div>
                <label className="mb-xs block font-label-md text-label-md text-on-surface-variant">
                  Who can tag you
                </label>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 font-body-md text-body-md"
                  value={privacy.allowTagging}
                  onChange={(event) =>
                    setPrivacy((prev) => ({ ...prev, allowTagging: event.target.value }))
                  }
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers</option>
                  <option value="none">No one</option>
                </select>
              </div>
              <div>
                <label className="mb-xs block font-label-md text-label-md text-on-surface-variant">
                  Activity visibility
                </label>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 font-body-md text-body-md"
                  value={privacy.activityVisibility}
                  onChange={(event) =>
                    setPrivacy((prev) => ({ ...prev, activityVisibility: event.target.value }))
                  }
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <label className="mt-md flex items-center gap-sm font-body-sm text-body-sm text-on-surface">
              <input
                type="checkbox"
                checked={privacy.showEmail}
                onChange={(event) =>
                  setPrivacy((prev) => ({ ...prev, showEmail: event.target.checked }))
                }
              />
              Show my email on my profile
            </label>
          </section>

          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-sm font-h3 text-h3 text-on-surface">Account Security</h2>
            <div className="mt-md flex flex-col justify-between gap-md border-t border-outline-variant/30 pt-md md:flex-row md:items-center">
              <div>
                <p className="font-label-md text-label-md text-on-surface">Password</p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  We&apos;ll send a secure link to your email to reset your password.
                </p>
              </div>
              <button
                className="whitespace-nowrap rounded-lg border border-outline-variant px-6 py-2 font-label-md text-label-md text-on-surface transition-colors duration-150 hover:bg-surface-container active:scale-95"
                type="button"
                onClick={handleResetPassword}
              >
                Reset Password
              </button>
            </div>
            <div className="mt-md flex flex-col justify-between gap-md border-t border-outline-variant/30 pt-md md:flex-row md:items-center">
              <div>
                <p className="font-label-md text-label-md text-on-surface">Sessions</p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  Sign out other devices using your account.
                </p>
              </div>
              <button
                className="whitespace-nowrap rounded-lg border border-outline-variant px-6 py-2 font-label-md text-label-md text-on-surface transition-colors duration-150 hover:bg-surface-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleLogoutOthers}
                disabled={isLoggingOutOthers}
              >
                {isLoggingOutOthers ? 'Logging out...' : 'Logout other devices'}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-error/30 bg-error-container/20 p-lg shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-sm font-h3 text-h3 text-on-surface">Danger Zone</h2>
            <div className="mt-md flex flex-col justify-between gap-md border-t border-error/20 pt-md md:flex-row md:items-center">
              <div>
                <p className="font-label-md text-label-md text-on-surface">Delete account</p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  Permanently delete your account and data. This cannot be undone.
                </p>
              </div>
              <button
                className="whitespace-nowrap rounded-lg border border-error px-6 py-2 font-label-md text-label-md text-error transition-colors duration-150 hover:bg-error-container/50 active:scale-95"
                type="button"
                onClick={handleDeleteAccount}
              >
                Contact support to delete
              </button>
            </div>
          </section>

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

          <div className="flex items-center justify-end gap-md pt-md">
            <button
              className="rounded-lg px-6 py-3 font-label-md text-label-md text-secondary transition-colors duration-150 hover:bg-surface-container active:scale-95"
              type="button"
              onClick={() => navigate('/profile')}
            >
              Cancel
            </button>
            <button
              className="rounded-lg border-b-2 border-surface-tint bg-primary-container px-8 py-3 font-label-md text-label-md text-white shadow-sm transition-colors duration-150 hover:bg-surface-tint active:scale-95"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Settings;
