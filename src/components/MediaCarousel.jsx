import { useMemo, useState } from 'react';

const isVideo = (item) => item?.type === 'video' || item?.url?.includes('/video/');

export default function MediaCarousel({ media = [], poster }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const items = useMemo(() => media.filter((item) => item?.url), [media]);

  if (!items.length) return null;

  const active = items[activeIndex] || items[0];
  const showDots = items.length > 1;

  return (
    <div className="relative w-full overflow-hidden">
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

      {showDots && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
          {items.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              aria-label={`View media ${index + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === activeIndex ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
