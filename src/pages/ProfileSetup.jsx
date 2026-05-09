import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/apiService';
import { useUser } from '../context/UserContext.jsx';
import { getApiErrorMessage } from '../utils/errors';

const backgroundImageUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMz8ScvU_5mTOboT-iwVSBBpnCN-s9ros5qOnSGy5rrXQibzEP6vKyP-9H5_l5i31fvXhmRIYOLXYl319Dix6wiQE0RFb_Eo5jcTRK2L-I9x0FOeoRKvLMZnzNxJd-Z1W1hpjY2scV0Yxfx21WEaJ5NvmZ_P5AacT98DxnpFE6GStQzUMmELiZ5sy9H81JIQHv_WgwtrWGPWJQ0EG_suB_SNYL35ZRau8z8yCA4ExtnQv2U3y_pMPKTB4V9gtmOCKWcfkSXIX0DA';

const preferenceOptions = [
  { value: 'Travel', icon: 'flight' },
  { value: 'Photography' },
  { value: 'Food' },
  { value: 'Lifestyle' },
  { value: 'Tech', icon: 'devices' },
  { value: 'Nature' },
  { value: 'Architecture' },
  { value: 'Minimalism' },
];

const extractUser = (payload) => payload?.data?.user || payload?.user || null;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const fileInputRef = useRef(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [selectedPrefs, setSelectedPrefs] = useState(() => new Set());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    try {
      let updatedUser = null;

      if (avatarFile) {
        const avatarResponse = await userService.uploadAvatar({ file: avatarFile });
        updatedUser = extractUser(avatarResponse);
      }

      const response = await userService.updateProfile({
        username: username.trim(),
        bio,
        extraInfo,
        preferences: preferenceList,
        isFirstLogin: false,
        profileCompleted: true,
      });
      updatedUser = extractUser(response) || updatedUser;

      if (updatedUser) {
        updateUser(updatedUser);
      }

      navigate('/profile', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to complete profile.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await userService.updateProfile({
        isFirstLogin: false,
        profileCompleted: false,
      });
      const updatedUser = extractUser(response);
      if (updatedUser) {
        updateUser(updatedUser);
      }
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to skip profile setup.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-on-background antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[60px] opacity-30"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        aria-hidden="true"
      />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-margin_mobile py-10 md:px-margin_desktop">
        <section className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-surface-container bg-surface-container-lowest shadow-[0_20px_40px_-10px_rgba(0,0,0,0.04)]">
          <div className="px-6 py-8 md:px-10 md:py-10">
            <div className="mb-8 text-center">
              <span className="rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                Step 1 of 1
              </span>
            </div>

            <header className="mb-10 text-center">
              <h1 className="font-h2 text-h2 text-on-surface">Complete your profile</h1>
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                Let the community know who you are. A great photo goes a long way.
              </p>
            </header>

            <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center justify-center">
                <div className="group flex cursor-pointer flex-col items-center">
                  <button
                    className="relative mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-outline-variant bg-surface-container-low transition-all group-hover:border-primary-container group-hover:bg-surface-container"
                    type="button"
                    onClick={handleFilePick}
                  >
                    {avatarPreview ? (
                      <img
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                        src={avatarPreview}
                      />
                    ) : (
                      <span
                        className="material-symbols-outlined text-4xl text-on-surface-variant transition-colors group-hover:text-primary-container"
                        aria-hidden="true"
                      >
                        add_a_photo
                      </span>
                    )}
                    <div className="absolute inset-0 bg-primary-container/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                  <button
                    className="flex items-center gap-2 font-label-md text-label-md text-primary-container transition-colors hover:text-primary"
                    type="button"
                    onClick={handleFilePick}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      upload
                    </span>
                    Add Profile Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="ml-1 font-label-sm text-label-sm text-on-surface" htmlFor="username">
                    Username
                  </label>
                  <input
                    className="w-full rounded-xl border border-surface-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container"
                    id="username"
                    name="username"
                    placeholder="@yourname"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="ml-1 font-label-sm text-label-sm text-on-surface" htmlFor="bio">
                    Bio
                  </label>
                  <textarea
                    className="w-full resize-none rounded-xl border border-surface-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container"
                    id="bio"
                    name="bio"
                    placeholder="Photographer, traveler, coffee enthusiast..."
                    rows={3}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="ml-1 font-label-sm text-label-sm text-on-surface" htmlFor="extraInfo">
                    Extra info
                  </label>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
                      aria-hidden="true"
                    >
                      link
                    </span>
                    <input
                      className="w-full rounded-xl border border-surface-variant bg-surface-container-low py-3 pl-11 pr-4 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container"
                      id="extraInfo"
                      name="extraInfo"
                      placeholder="Website, location, or anything else"
                      type="text"
                      value={extraInfo}
                      onChange={(event) => setExtraInfo(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="ml-1 font-label-sm text-label-sm text-on-surface">
                  What do you love capturing?
                </label>
                <div className="flex flex-wrap gap-2">
                  {preferenceOptions.map((option) => {
                    const isSelected = selectedPrefs.has(option.value);
                    return (
                      <button
                        key={option.value}
                        className={
                          isSelected
                            ? 'flex items-center gap-1 rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md text-white shadow-sm transition-transform active:scale-95'
                            : 'rounded-full border border-transparent bg-secondary-container/50 px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-all hover:border-surface-variant hover:bg-secondary-container hover:text-on-surface active:scale-95'
                        }
                        type="button"
                        onClick={() => togglePreference(option.value)}
                      >
                        {option.icon ? (
                          <span
                            className="material-symbols-outlined text-[16px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            aria-hidden="true"
                          >
                            {option.icon}
                          </span>
                        ) : null}
                        {option.value}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-4">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-b-2 border-[#D64348] bg-primary-container py-4 text-center font-label-md text-label-md text-white shadow-[0_4px_14px_0_rgba(255,90,95,0.25)] transition-all hover:bg-[#E04E53] active:scale-[0.98]"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Complete Profile'}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </button>
                <button
                  className="w-full border-none bg-transparent py-3 text-center font-label-md text-label-md text-on-surface-variant transition-colors hover:text-on-surface"
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfileSetup;
