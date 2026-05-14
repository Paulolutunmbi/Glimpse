import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/apiService';
import MediaCarousel from '../components/MediaCarousel';

const MAX_MEDIA_COUNT = 10;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_TYPES = ['image/', 'video/'];

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
  const [hashtags, setHashtags] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

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
      const isAllowed = ALLOWED_TYPES.some((type) => file.type.startsWith(type));
      if (!isAllowed) {
        setError('Only image or video files are allowed.');
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
    setError('');
    setIsSubmitting(true);
    setProgress(0);

    if (!files.length && !caption.trim()) {
      setError('Add a caption or media before posting.');
      setIsSubmitting(false);
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
      setError('Failed to publish moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-background font-body-md antialiased">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h1 className="font-h3 text-on-surface">Create Moment</h1>
            <p className="text-body-sm text-on-surface-variant">Step {step} of 2</p>
          </div>
          <button
            className="rounded-full border border-outline-variant px-4 py-2 text-sm transition-colors hover:border-primary-container hover:bg-primary-container/10"
            type="button"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-40 sm:px-6 sm:py-10 md:pb-10">
        <form className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" onSubmit={handleSubmit}>
          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
            {step === 1 ? (
              <>
                <h2 className="mb-4 font-h4 text-on-surface">Select media</h2>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <button
                  className={`mt-2 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-container hover:bg-primary-container/10 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary-container/30 ${
                    files.length > 0
                      ? 'border-primary-container bg-primary-container/10 text-on-surface'
                      : 'border-outline-variant bg-white text-on-surface'
                  }`}
                  type="button"
                  onClick={openFilePicker}
                >
                  <span className="font-medium">{files.length > 0 ? 'Change files' : 'Choose files'}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      files.length > 0
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {files.length > 0 ? `${files.length} selected` : 'Images or videos'}
                  </span>
                </button>

                {previews.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {previews.map((preview, index) => (
                      <div key={preview.url} className="relative overflow-hidden rounded-xl">
                        {preview.type === 'video' ? (
                          <video className="h-48 w-full object-cover" src={preview.url} playsInline />
                        ) : (
                          <img className="h-48 w-full object-cover" src={preview.url} alt={preview.alt} />
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-black/55 px-3 py-2 text-xs text-white">
                          <button type="button" onClick={() => handleReorder(index, -1)}>
                            Move up
                          </button>
                          <button type="button" onClick={() => handleReorder(index, 1)}>
                            Move down
                          </button>
                          <button type="button" onClick={() => handleRemove(index)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="mb-4 font-h4 text-on-surface">Preview</h2>
                <MediaCarousel media={previews} />
              </>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
            {step === 1 ? (
              <>
                <h2 className="mb-4 font-h4 text-on-surface">Before you continue</h2>
                <p className="text-sm text-on-surface-variant">
                  Choose up to 10 photos or videos. You can rearrange or remove them later.
                </p>
                {error && (
                  <div className="mt-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
                    {error}
                  </div>
                )}
                <button
                  className="mt-6 w-full rounded-lg bg-primary-container px-4 py-3 text-white transition-all hover:bg-primary-container/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
                  type="button"
                  disabled={files.length === 0}
                  onClick={() => setStep(2)}
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <h2 className="mb-4 font-h4 text-on-surface">Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-body-sm font-label-md text-on-surface">Caption</label>
                    <textarea
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50"
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
                  {useMemo(() => {
                    const hashtagRegex = /#[\w]+/g;
                    const extracted = (caption.match(hashtagRegex) || []).map((tag) => tag.replace(/^#+/, ''));
                    return extracted.length > 0 ? (
                      <div className="rounded-lg bg-surface-dim p-3 space-y-2">
                        <p className="text-xs font-label-sm text-on-surface">✨ Auto-detected Hashtags</p>
                        <div className="flex flex-wrap gap-2">
                          {extracted.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  }, [caption])}

                  <div>
                    <label className="mb-1 block text-body-sm font-label-md text-on-surface">Tags (comma separated, optional)</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50"
                      placeholder="e.g., photography, travel, nature"
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-body-sm font-label-md text-on-surface">Location (optional)</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50"
                      placeholder="Where was this taken?"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-body-sm font-label-md text-on-surface">Audience</label>
                    <select
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50"
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

                {progress > 0 && (
                  <div className="mt-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full bg-primary-container"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">Uploading: {progress}%</p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex items-center gap-3">
                  <button
                    className="flex-1 rounded-lg border border-outline-variant px-4 py-3 font-label-md text-on-surface transition-colors hover:border-primary-container hover:bg-surface-dim"
                    type="button"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-primary px-4 py-3 font-label-md text-white transition-colors hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Moment'}
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
