import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/apiService';
import { useUser } from '../context/UserContext.jsx';
import { getApiErrorMessage } from '../utils/errors';
import Avatar from '../components/Avatar';

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

const extractProfilePayload = (payload) => payload?.data || payload || null;

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile, updateUser, updateProfilePayload } = useUser();
  const fileInputRef = useRef(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [selectedPrefs, setSelectedPrefs] = useState(() => new Set());
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user && !profile) return;
    setFullName(user?.fullName || user?.name || '');
    setUsername(user?.username || user?.name || '');
    setBio(profile?.bio || user?.bio || '');
    setExtraInfo(profile?.extraInfo || user?.extraInfo || '');
    setSelectedPrefs(new Set(profile?.preferences || user?.preferences || []));
    setAvatarPreview(profile?.avatar || user?.profilePicture || user?.avatar || '');
  }, [user, profile]);

  const preferenceList = useMemo(() => Array.from(selectedPrefs), [selectedPrefs]);

  const handleFilePick = () => {
    fileInputRef.current?.click();
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
      let updatedPayload = null;

      if (avatarFile) {
        const avatarResponse = await userService.uploadAvatar({ file: avatarFile });
        updatedPayload = extractProfilePayload(avatarResponse);
      }

      const response = await userService.updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
        bio,
        extraInfo,
        preferences: preferenceList,
      });
      updatedPayload = extractProfilePayload(response) || updatedPayload;

      if (updatedPayload) {
        updateProfilePayload(updatedPayload);
        if (updatedPayload.user) {
          updateUser(updatedPayload.user);
        }
      }

      setAvatarFile(null);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="font-h1 text-h1 text-on-surface">Edit Profile</h1>
          <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
            Update your profile details and preferences.
          </p>
        </div>

        <form className="space-y-lg" onSubmit={handleSubmit}>
          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-md font-h3 text-h3 text-on-surface">Profile Details</h2>
            <div className="mb-lg flex flex-col items-start gap-lg md:flex-row">
              <div className="flex flex-col items-center gap-md">
                <button
                  className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-surface-container-highest shadow-sm"
                  type="button"
                  onClick={handleFilePick}
                >
                  <Avatar
                    alt="Profile picture preview"
                    className="h-full w-full"
                    src={avatarPreview}
                    name={username || user?.username || user?.name}
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
              </div>

              <div className="w-full flex-1 space-y-md">
                <div>
                  <label
                    className="mb-xs block font-label-md text-label-md text-on-surface-variant"
                    htmlFor="fullName"
                  >
                    Full name
                  </label>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-2 font-body-md text-body-md text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
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

export default EditProfile;
