import { useState } from 'react';

interface PosterDisplayProps {
  posterUrl: string | null;
}

export function PosterDisplay({ posterUrl }: PosterDisplayProps) {
  const [imageError, setImageError] = useState(false);

  if (!posterUrl || imageError) {
    return (
      <div className="w-full h-64 bg-muted/20 flex items-center justify-center">
        <span className="text-muted-foreground text-lg">No poster available</span>
      </div>
    );
  }

  return (
    <div className="w-full flex-shrink-0">
      <img
        src={posterUrl}
        alt="Display poster"
        className="w-full h-auto object-cover object-top"
        onError={() => setImageError(true)}
        onLoad={() => setImageError(false)}
      />
    </div>
  );
}
