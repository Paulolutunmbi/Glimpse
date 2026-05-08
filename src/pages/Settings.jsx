import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/apiService';
import { useUser } from '../context/UserContext.jsx';
import { getApiErrorMessage } from '../utils/errors';

const preferenceOptions = [
  'Photography',
  'Minimalism',
  'Architecture',
  'Nature',
  'Travel',
  'Art',
  'Food',
  'Lifestyle',
  'Tech',
];

const extractProfile = (payload) => payload?.data || payload?.profile || null;

const Settings = () => {
  const navigate = useNavigate();
  const { profile, updateProfileState, isProfileLoading } = useUser();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [selectedPrefs, setSelectedPrefs] = useState(() => new Set());
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.user?.username || profile.user?.name || '');
    setBio(profile.profile?.bio || '');
    setExtraInfo(profile.profile?.extraInfo || '');
    setSelectedPrefs(new Set(profile.profile?.preferences || []));
    setAvatarPreview(profile.profile?.avatar || '');
    setCoverPreview(profile.profile?.coverImage || '');
  }, [profile]);

  const preferenceList = useMemo(() => Array.from(selectedPrefs), [selectedPrefs]);

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverPick = () => {
    coverInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or less.');
      return;
    }

    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      setAvatarPreview(result);
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid cover image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Cover image must be 5MB or less.');
      return;
    }

    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      setCoverPreview(result);
      setCoverFile(file);
    };
    reader.readAsDataURL(file);
  };

  const togglePreference = (value) => {
    setSelectedPrefs((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('bio', bio);
      formData.append('extraInfo', extraInfo);
      formData.append('preferences', JSON.stringify(preferenceList));

      if (avatarFile) {
        formData.append('profilePicture', avatarFile);
      }

      if (coverFile) {
        formData.append('coverImage', coverFile);
      }

      const response = await userService.updateProfile(formData);
      const updatedProfile = extractProfile(response);
      if (updatedProfile) {
        updateProfileState(updatedProfile);
      }

      setAvatarFile(null);
      setCoverFile(null);
      setSuccess('Settings saved successfully.');
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

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-zinc-100 bg-white/80 shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 font-['Plus_Jakarta_Sans']">
          <div className="flex items-center gap-3">
            <img
              src="/images/glimpse-logo-light-dark.png"
              alt="Glimpse"
              className="h-8 w-auto object-contain"
            />
          </div>
          <nav className="hidden items-center gap-4 md:flex">
            <span className="cursor-pointer rounded-md px-3 py-2 font-label-md text-zinc-500 transition-colors duration-200 hover:bg-zinc-50">
              Feed
            </span>
            <span className="cursor-pointer rounded-md px-3 py-2 font-label-md text-zinc-500 transition-colors duration-200 hover:bg-zinc-50">
              Explore
            </span>
            <span className="cursor-pointer rounded-md px-3 py-2 font-label-md font-semibold text-[#FF5A5F] transition-colors duration-200 hover:bg-zinc-50">
              Profile
            </span>
          </nav>
          <div className="flex items-center gap-4">
            <button
              className="rounded-full p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-50"
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
            Manage your profile, preferences, and security.
          </p>
        </div>

        <form className="space-y-lg" onSubmit={handleSubmit}>
          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-md font-h3 text-h3 text-on-surface">Profile Settings</h2>
            <div className="mb-lg flex flex-col items-start gap-lg md:flex-row">
              <div className="flex flex-col items-center gap-md">
                <button
                  className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-surface-container-highest shadow-sm"
                  type="button"
                  onClick={handleFilePick}
                >
                  <img
                    alt="Profile picture preview"
                    className="h-full w-full object-cover"
                    src={
                      avatarPreview ||
                      '/images/glimpse-icon.png'
                    }
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </div>
                </button>
                <button
                  className="font-label-md text-label-md text-primary-container transition-colors hover:text-surface-tint"
                  type="button"
                  onClick={handleFilePick}
                >
                  Change Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  className="mt-4 font-label-md text-label-md text-primary-container transition-colors hover:text-surface-tint"
                  type="button"
                  onClick={handleCoverPick}
                >
                  Change Cover
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
              </div>

              <div className="w-full flex-1 space-y-md">
                <div>
                  <label
                    className="mb-xs block font-label-md text-label-md text-on-surface-variant"
                    htmlFor="coverPreview"
                  >
                    Cover preview
                  </label>
                  <div
                    id="coverPreview"
                    className="h-32 w-full overflow-hidden rounded-lg border border-outline-variant bg-surface-variant"
                  >
                    {coverPreview ? (
                      <img
                        alt="Cover preview"
                        className="h-full w-full object-cover"
                        src={coverPreview}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-on-surface-variant">
                        No cover image yet
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    className="mb-xs block font-label-md text-label-md text-on-surface-variant"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-2 font-body-md text-body-md text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
                <div>
                  <label
                    className="mb-xs block font-label-md text-label-md text-on-surface-variant"
                    htmlFor="bio"
                  >
                    Bio
                  </label>
                  <textarea
                    className="w-full resize-none rounded-lg border border-outline-variant bg-surface-bright px-4 py-2 font-body-md text-body-md text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                    id="bio"
                    rows="3"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                  <p className="mt-xs text-right font-label-sm text-label-sm text-on-surface-variant/70">
                    {bio.length} / 150
                  </p>
                </div>
                <div>
                  <label
                    className="mb-xs block font-label-md text-label-md text-on-surface-variant"
                    htmlFor="extraInfo"
                  >
                    Extra info
                  </label>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-2 font-body-md text-body-md text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                    id="extraInfo"
                    type="text"
                    value={extraInfo}
                    onChange={(event) => setExtraInfo(event.target.value)}
                    placeholder="Website, location, or a short tagline"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-sm font-h3 text-h3 text-on-surface">Preferences</h2>
            <p className="mb-md font-body-sm text-body-sm text-on-surface-variant">
              Select categories to personalize your Explore feed.
            </p>
            <div className="flex flex-wrap gap-sm">
              {preferenceOptions.map((option) => {
                const isSelected = selectedPrefs.has(option);
                return (
                  <button
                    key={option}
                    className={
                      isSelected
                        ? 'flex items-center gap-1 rounded-full border border-primary-container/20 bg-primary-container/10 px-4 py-2 font-label-md text-label-md text-primary-container transition-colors duration-150 hover:bg-primary-container/20 active:scale-95'
                        : 'rounded-full bg-secondary-container px-4 py-2 font-label-md text-label-md text-on-secondary-container transition-colors duration-150 hover:bg-secondary-fixed-dim active:scale-95'
                    }
                    type="button"
                    onClick={() => togglePreference(option)}
                  >
                    {isSelected ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : null}
                    {option}
                  </button>
                );
              })}
            </div>
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
              disabled={isSubmitting || isProfileLoading}
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
