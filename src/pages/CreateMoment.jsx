import { useMemo, useState, useEffect } from 'react';
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
      const formData = new FormData();
      files.forEach((file) => formData.append('media', file));
      if (caption.trim()) formData.append('caption', caption.trim());
      if (location.trim()) formData.append('location', location.trim());
      formData.append('visibility', visibility);
      if (tags.trim()) formData.append('tags', JSON.stringify(parseList(tags)));
      if (hashtags.trim()) formData.append('hashtags', JSON.stringify(parseList(hashtags)));

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
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h1 className="font-h3 text-on-surface">Create Moment</h1>
            <p className="text-body-sm text-on-surface-variant">Step {step} of 2</p>
          </div>
          <button
            className="rounded-full border border-outline-variant px-4 py-2 text-sm"
            type="button"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 pb-safe">
        <form className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" onSubmit={handleSubmit}>
          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
            {step === 1 ? (
              <>
                <h2 className="mb-4 font-h4 text-on-surface">Select media</h2>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm"
                  onChange={handleFileChange}
                />

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
                  className="mt-6 w-full rounded-lg bg-primary-container px-4 py-3 text-white transition-transform active:scale-[0.99]"
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
                    <label className="mb-1 block text-body-sm text-on-surface-variant">Caption</label>
                    <textarea
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2"
                      rows={4}
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-body-sm text-on-surface-variant">Hashtags (comma separated)</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2"
                      value={hashtags}
                      onChange={(event) => setHashtags(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-body-sm text-on-surface-variant">Tags (comma separated)</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2"
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-body-sm text-on-surface-variant">Location (optional)</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-body-sm text-on-surface-variant">Audience</label>
                    <select
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2"
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value)}
                    >
                      <option value="public">Public</option>
                      <option value="followers">Followers</option>
                      <option value="friends">Friends only</option>
                      <option value="private">Private</option>
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
                    className="flex-1 rounded-lg border border-outline-variant px-4 py-3"
                    type="button"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-primary-container px-4 py-3 text-white"
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
