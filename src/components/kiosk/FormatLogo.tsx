import { cn } from '@/lib/utils';

interface FormatLogoProps {
  type: 'audio' | 'video' | 'hdr';
  format: string;
  className?: string;
}

const LOGO_MAP: Record<string, Record<string, string>> = {
  audio: {
    'eac3': '/logos/audio/dolby-digital.svg',
    'ac3': '/logos/audio/dolby-digital.svg',
    'truehd': '/logos/audio/dolby-truehd.svg',
    'atmos': '/logos/audio/dolby-atmos.svg',
    'dts': '/logos/audio/dts.svg',
    'dtshd_ma': '/logos/audio/dts-hd.svg',
    'dtshd_hra': '/logos/audio/dts-hd.svg',
  },
  video: {
    '4k': '/logos/video/4k-uhd.svg',
    '1080p': '/logos/video/1080p.svg',
    '720p': '/logos/video/720p.svg',
  },
  hdr: {
    'dolbyvision': '/logos/video/dolby-vision.svg',
    'hdr10': '/logos/video/hdr10.svg',
    'hdr10plus': '/logos/video/hdr10plus.svg',
    'hlg': '/logos/video/hlg.svg',
  },
};

export function FormatLogo({ type, format, className }: FormatLogoProps) {
  const logoPath = LOGO_MAP[type]?.[format];
  
  if (!logoPath) return null;
  
  return (
    <img 
      src={logoPath} 
      alt={format} 
      className={cn("h-4 w-auto", className)} 
    />
  );
}
