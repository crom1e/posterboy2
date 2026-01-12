import { Play } from 'lucide-react';
import { DataCard } from './DataCard';
import { Progress } from '@/components/ui/progress';

interface ProgressCardProps {
  progress: number | null;
}

export function ProgressCard({ progress }: ProgressCardProps) {
  return (
    <DataCard title="Progress" icon={<Play size={16} />}>
      <div className="flex flex-col items-center justify-center py-1">
        <div className="text-2xl font-bold">
          {progress !== null ? `${Math.round(progress)}%` : '--'}
        </div>
        <Progress 
          value={progress ?? 0} 
          className="h-2 mt-2 w-full" 
        />
      </div>
    </DataCard>
  );
}
