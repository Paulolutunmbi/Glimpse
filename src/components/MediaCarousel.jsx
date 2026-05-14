import { useMemo, useState, useRef, useEffect } from 'react';

const isVideo = (item) => item?.type === 'video' || item?.url?.includes('/video/');

export default function MediaCarousel({ media = [], poster }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const items = useMemo(() => media.filter((item) => item?.url), [media]);

  if (!items.length) return null;

  const active = items[activeIndex] || items[0];
  const showDots = items.length > 1;
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

  const handlePrev = () => {
    if (canPrev) setActiveIndex(activeIndex - 1);
  };

  const handleNext = () => {
    if (canNext) setActiveIndex(activeIndex + 1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches?.[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches?.[0]?.clientX ?? 0;
    handleSwipe();
  };

  const handleSwipe = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && canNext) {
        handleNext();
      } else if (diff < 0 && canPrev) {
        handlePrev();
      }
    }
  };

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [canPrev, canNext, activeIndex]);

  return (
    <div 
      className="relative w-full overflow-hidden bg-surface-variant"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative aspect-[4/5] w-full bg-surface-variant">
        {isVideo(active) ? (
          <video
            className="h-full w-full object-cover"
            controls
            poster={active.thumbnailUrl || poster}
            preload="metadata"
            playsInline
            src={active.url}
          />
        ) : (
          <img
            className="h-full w-full object-cover"
            alt={active.alt || 'moment media'}
            loading="lazy"
            src={active.url}
          />
        )}
      </div>

      {/* Navigation Arrows */}
      {showDots && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canPrev}
            aria-label="Previous media"
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full flex items-center justify-center transition-all ${
              canPrev
                ? 'bg-black/50 text-white hover:bg-black/70 cursor-pointer'
                : 'bg-black/20 text-white/50 cursor-not-allowed opacity-50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            aria-label="Next media"
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full flex items-center justify-center transition-all ${
              canNext
                ? 'bg-black/50 text-white hover:bg-black/70 cursor-pointer'
                : 'bg-black/20 text-white/50 cursor-not-allowed opacity-50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {showDots && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
          {items.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              aria-label={`View media ${index + 1} of ${items.length}`}
              className={`h-2 w-2 rounded-full transition-all ${
                index === activeIndex ? 'bg-white w-6' : 'bg-white/50'
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {showDots && (
        <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-medium">
          {activeIndex + 1} / {items.length}
        </div>
      )}
    </div>
  );
}
