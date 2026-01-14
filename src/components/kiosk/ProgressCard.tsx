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
    <DataCard title="Progress">
      <div className="relative flex flex-col items-center justify-center py-1">
        {/* Player logo in upper right */}
        {player && (
          <img 
            src={PLAYER_LOGOS[player]} 
            alt={player} 
            className="absolute top-0 right-0 h-5 w-auto"
          />
        )}
        
        {/* Progress percentage */}
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
