import { Monitor } from 'lucide-react';
import { DataCard } from './DataCard';
import { MediaDetails } from '@/types/kiosk';
import { FormatLogo } from './FormatLogo';

interface DetailsCardProps {
  details: MediaDetails | null;
}

export function DetailsCard({ details }: DetailsCardProps) {
  const hasVideoLogos = details?.resolutionType || details?.hdrType;
  const hasAudioLogo = details?.audioCodec;

  return (
    <DataCard title="Details" icon={<Monitor size={16} />}>
      {details ? (
        <div className="text-sm">
          {/* Title Row */}
          {details.title && (
            <div className="font-semibold truncate pb-1.5 border-b border-border/50 mb-1.5">
              {details.title}
            </div>
          )}

          {/* Single line: Video · Audio · Aspect */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Video section */}
            <div className="flex items-center gap-1">
              {hasVideoLogos ? (
                <>
                  {details.resolutionType && (
                    <FormatLogo type="video" format={details.resolutionType} />
                  )}
                  {details.hdrType && (
                    <FormatLogo type="hdr" format={details.hdrType} />
                  )}
                </>
              ) : (
                <span className="font-medium">{details.resolution}</span>
              )}
              {details.videoTranscoded && (
                <span className="text-xs text-yellow-500 font-medium">TC</span>
              )}
            </div>

            <span className="text-muted-foreground">·</span>

            {/* Audio section */}
            <div className="flex items-center gap-1">
              {hasAudioLogo ? (
                <>
                  <span className="font-medium">{details.audioChannels}</span>
                  <FormatLogo type="audio" format={details.audioCodec!} />
                </>
              ) : (
                <span className="font-medium">{details.audio}</span>
              )}
              {details.audioTranscoded && (
                <span className="text-xs text-yellow-500 font-medium">TC</span>
              )}
            </div>

            <span className="text-muted-foreground">·</span>

            {/* Aspect */}
            <span className="font-medium">{details.aspect}</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-2">--</div>
      )}
    </DataCard>
  );
}
