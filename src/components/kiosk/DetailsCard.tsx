import { Monitor } from 'lucide-react';
import { DataCard } from './DataCard';
import { MediaDetails } from '@/hooks/useMqtt';

interface DetailsCardProps {
  details: MediaDetails | null;
}

export function DetailsCard({ details }: DetailsCardProps) {
  return (
    <DataCard title="Details" icon={<Monitor size={16} />}>
      {details ? (
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resolution</span>
            <span className="font-medium">{details.resolution}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Audio</span>
            <span className="font-medium">{details.audio}</span>
          </div>
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
