import { DataCard } from './DataCard';
import { Progress } from '@/components/ui/progress';

interface ProgressCardProps {
  progress: number | null;
  player: 'plex' | 'kodi' | null;
}

const PLAYER_LOGOS: Record<string, string> = {
  plex: '/logos/player/plex.svg',
  kodi: '/logos/player/kodi.svg',
};

export function ProgressCard({ progress, player }: ProgressCardProps) {
  return (
    <DataCard 
      title="Progress"
      headerRight={player && (
        <img 
          src={PLAYER_LOGOS[player]} 
          alt={player} 
          className="h-4 w-auto"
        />
      )}
    >
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
