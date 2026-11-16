import React, { useState } from 'react';
import { Play } from 'lucide-react';

export function extractYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

interface YouTubeFacadeProps {
  videoId?: string | null;
  videoUrl?: string | null;
  title?: string;
  thumbnailUrl?: string | null;
  className?: string;
  aspectRatio?: 'video' | 'wide';
}

export const YouTubeFacade: React.FC<YouTubeFacadeProps> = ({
  videoId,
  videoUrl,
  title = 'Watch Video',
  thumbnailUrl,
  className = '',
  aspectRatio = 'video'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const resolvedId = videoId || extractYouTubeId(videoUrl);

  const fallbackThumb = resolvedId
    ? `https://img.youtube.com/vi/${resolvedId}/hqdefault.jpg`
    : '/images/hero/hero-bg.jpg';

  const poster = thumbnailUrl || fallbackThumb;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resolvedId) {
      setIsPlaying(true);
    }
  };

  const aspectClass = aspectRatio === 'wide' ? 'aspect-[21/9]' : 'aspect-video';

  if (!resolvedId) {
    return (
      <div className={`relative ${aspectClass} rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center ${className}`}>
        {poster && (
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover opacity-60"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>
    );
  }

  return (
    <div
      className={`relative ${aspectClass} rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-xl group ${className}`}
    >
      {isPlaying ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${resolvedId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
        />
      ) : (
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label={`Play ${title}`}
          className="w-full h-full relative block text-left cursor-pointer group focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 group-hover:via-black/10 transition-colors" />

          {/* Center Play Button Facade */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-red-600/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.7)] group-hover:bg-red-500 group-hover:scale-110 transition-all duration-300 border border-white/20">
              <Play className="w-6 h-6 md:w-7 md:h-7 fill-white translate-x-0.5" />
            </div>
          </div>

          {/* Click to play badge */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] md:text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-neutral-200 border border-white/10">
              CLICK TO PLAY
            </span>
            <span className="text-neutral-400 drop-shadow">No Autoplay</span>
          </div>
        </button>
      )}
    </div>
  );
};
