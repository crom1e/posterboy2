import { Monitor } from 'lucide-react';
import { DataCard } from './DataCard';
import { MediaDetails } from '@/hooks/useMqtt';
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
        <div className="space-y-1.5 text-sm">
          {/* Resolution Row */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Resolution</span>
            <div className="flex items-center gap-1.5">
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
            </div>
          </div>

          {/* Audio Row */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Audio</span>
            <div className="flex items-center gap-1.5">
              {hasAudioLogo ? (
                <>
                  <span className="font-medium">{details.audioChannels}</span>
                  <FormatLogo type="audio" format={details.audioCodec!} />
                </>
              ) : (
                <span className="font-medium">{details.audio}</span>
              )}
            </div>
          </div>

          {/* Aspect Row */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aspect</span>
            <span className="font-medium">{details.aspect}</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-2">--</div>
      )}
    </DataCard>
  );
}
