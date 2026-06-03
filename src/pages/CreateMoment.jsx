import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/apiService';
import MediaCarousel from '../components/MediaCarousel';

const MAX_MEDIA_COUNT = 10;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

const parseList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const moveItem = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export default function CreateMoment() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const submitRequestIdRef = useRef(null);
  const submitInFlightRef = useRef(false);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        alt: file.name,
      })),
    [files]
  );

  const extractedHashtags = useMemo(() => {
    const hashtagRegex = /#[\w]+/g;
    return (caption.match(hashtagRegex) || []).map((tag) => tag.replace(/^#+/, ''));
  }, [caption]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    const next = [];
    for (const file of selected) {
      const isAllowed = ALLOWED_TYPES.includes(file.type);
      if (!isAllowed) {
        setError('Only JPEG, PNG, WebP, MP4, MOV, or WebM files are allowed.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError('Each file must be 50MB or less.');
        return;
      }
      next.push(file);
    }

    if (next.length + files.length > MAX_MEDIA_COUNT) {
      setError('You can upload up to 10 files per moment.');
      return;
    }

    setError('');
    setFiles((prev) => [...prev, ...next]);
    event.target.value = '';
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReorder = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= files.length) return;
    setFiles((prev) => moveItem(prev, index, nextIndex));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setError('');
    setIsSubmitting(true);
    setProgress(0);
    submitRequestIdRef.current =
      submitRequestIdRef.current ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (!files.length && !caption.trim()) {
      setError('Add a caption or media before posting.');
      setIsSubmitting(false);
      submitInFlightRef.current = false;
      return;
    }

    try {
      // Auto-extract hashtags from caption
      const hashtagRegex = /#[\w]+/g;
      const extractedHashtags = (caption.match(hashtagRegex) || [])
        .map((tag) => tag.replace(/^#+/, ''))
        .filter(Boolean);

      const formData = new FormData();
      files.forEach((file) => formData.append('media', file));
      if (caption.trim()) formData.append('caption', caption.trim());
      if (location.trim()) formData.append('location', location.trim());
      formData.append('visibility', visibility);
      formData.append('clientRequestId', submitRequestIdRef.current);
      if (tags.trim()) formData.append('tags', JSON.stringify(parseList(tags)));
      // Use extracted hashtags from caption instead of manual input
      if (extractedHashtags.length > 0) {
        formData.append('hashtags', JSON.stringify(extractedHashtags));
      }

      await postService.createPost(formData, {
        onProgress: (event) => {
          if (!event.total) return;
          setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });

      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.details || 'Failed to publish moment.');
      submitRequestIdRef.current = null;
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-on-background font-body-md antialiased">
      <header className="flex-shrink-0 sticky top-0 z-40 border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-h3 text-on-surface truncate">Create Moment</h1>
            <p className="text-body-sm text-on-surface-variant">Step {step} of 2</p>
          </div>
          <button
            className="rounded-full border border-outline-variant px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-200 hover:border-primary-container hover:bg-primary-container/10 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container/30 flex-shrink-0 ml-2"
            type="button"
            onClick={() => navigate(-1)}
          >
            Close
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full overflow-y-auto">
        <form className="flex-1 flex flex-col w-full mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6 gap-4 sm:gap-6 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" onSubmit={handleSubmit} key={`step-${step}`}>
          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-6 shadow-sm w-full min-h-min lg:col-span-1">
            {step === 1 ? (
              <>
                <h2 className="mb-4 font-h4 text-on-surface">Select media</h2>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <button
                  className={`mt-2 flex w-full items-center justify-between rounded-xl border px-3 sm:px-4 py-3 text-left text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-container hover:bg-primary-container/10 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary-container/30 ${
                    files.length > 0
                      ? 'border-primary-container bg-primary-container/10 text-on-surface font-semibold shadow-md'
                      : 'border-outline-variant bg-white text-on-surface hover:shadow-md'
                  }`}
                  type="button"
                  onClick={openFilePicker}
                >
                  <span className="font-medium text-sm sm:text-base flex items-center gap-2">{files.length > 0 ? '✓ Change files' : '📁 Choose files'}</span>
                  <span
                    className={`rounded-full px-2 sm:px-3 py-1 text-xs font-semibold transition-all ${
                      files.length > 0
                        ? 'bg-primary-container text-white scale-105'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {files.length > 0 ? `${files.length} selected` : '0 files'}
                  </span>
                </button>

                {previews.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                    {previews.map((preview, index) => (
                      <div key={preview.url} className="relative overflow-hidden rounded-xl group aspect-square">
                        {preview.type === 'video' ? (
                          <video className="h-full w-full object-cover" src={preview.url} playsInline />
                        ) : (
                          <img className="h-full w-full object-cover" src={preview.url} alt={preview.alt} />
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-1 sm:gap-2 bg-black/70 px-2 sm:px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => handleReorder(index, -1)} className="px-2 py-1 rounded bg-black/50 hover:bg-black transition-colors active:scale-95">
                            ↑
                          </button>
                          <button type="button" onClick={() => handleReorder(index, 1)} className="px-2 py-1 rounded bg-black/50 hover:bg-black transition-colors active:scale-95">
                            ↓
                          </button>
                          <button type="button" onClick={() => handleRemove(index)} className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-700 transition-colors active:scale-95">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="mb-4 font-h4 text-on-surface">Media Preview</h2>
                {previews.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-outline-variant/20 bg-white p-2">
                    <MediaCarousel media={previews} />
                  </div>
                ) : (
                  <div className="max-h-96 flex items-center justify-center rounded-lg border border-dashed border-outline-variant/50 bg-surface-container-lowest p-8 text-center">
                    <div>
                      <p className="text-sm text-on-surface-variant mb-2">No media selected</p>
                      <p className="text-xs text-on-surface-variant opacity-70">Your media preview will appear here</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-6 shadow-sm w-full overflow-y-auto lg:col-span-1 lg:max-h-[80vh]">
            {step === 1 ? (
              <>
                <h2 className="mb-3 font-h4 text-on-surface">Before you continue</h2>
                <p className="text-sm text-on-surface-variant mb-4">
                  Choose up to 10 photos or videos. You can rearrange or remove them later.
                </p>
                {error && (
                  <div className="rounded-lg border border-error/30 bg-error-container px-3 py-3 text-xs sm:text-sm text-on-error-container mb-4">
                    {error}
                  </div>
                )}
                <button
                  className="w-full rounded-lg bg-primary-container px-4 py-3 text-white font-semibold text-sm sm:text-base transition-all duration-200 hover:bg-primary-container/90 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-primary-container/30"
                  type="button"
                  disabled={files.length === 0}
                  onClick={() => {
                    if (files.length > 0) setStep(2);
                  }}
                >
                  {files.length === 0 ? 'Select files to continue →' : 'Next →'}
                </button>
              </>
            ) : (
              <>
                <h2 className="mb-4 font-h4 text-on-surface">Details</h2>
                <div className="space-y-3 sm:space-y-4 pr-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-on-surface">Caption</label>
                    <textarea
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all resize-none"
                      rows={4}
                      placeholder="Write a caption... Use #hashtags directly in your text!"
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                    />
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {caption.length} characters
                    </p>
                  </div>

                  {/* Auto-extracted hashtags display */}
                  {extractedHashtags.length > 0 ? (
                    <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-3 space-y-2">
                      <p className="text-xs font-semibold text-primary">✨ Auto-detected Hashtags</p>
                      <div className="flex flex-wrap gap-2">
                        {extractedHashtags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-on-surface">Tags (comma separated, optional)</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                      placeholder="e.g., photography, travel, nature"
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-on-surface">Location (optional)</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                      placeholder="Where was this taken?"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-on-surface">Audience</label>
                    <select
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all cursor-pointer"
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value)}
                    >
                      <option value="public">🌍 Public - Everyone can see</option>
                      <option value="followers">👥 Followers - Only your followers</option>
                      <option value="friends">💫 Friends - Only mutual followers</option>
                      <option value="private">🔒 Private - Only you</option>
                    </select>
                  </div>
                </div>

                {progress > 0 && progress < 100 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full bg-primary-container transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-blue-700 font-medium">Uploading: {progress}%</p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-lg border border-error/30 bg-error-container px-3 py-3 text-xs sm:text-sm text-on-error-container">
                    {error}
                  </div>
                )}

                <div className="mt-6 space-y-2 sm:space-y-0 sm:flex items-center gap-3 pb-2 flex-wrap lg:flex-nowrap">
                  <button
                    className="flex-1 rounded-lg border border-outline-variant px-4 py-3 font-semibold text-on-surface text-sm sm:text-base transition-all duration-200 hover:border-primary-container hover:bg-primary-container/5 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container/30"
                    type="button"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-white text-sm sm:text-base transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Publishing...
                      </span>
                    ) : (
                      'Publish Moment →'
                    )}
                  </button>
                </div>
              </>
            )}
          </section>
        </form>
      </main>
    </div>
  );
}
