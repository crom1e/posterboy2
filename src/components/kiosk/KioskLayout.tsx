import { useKioskData } from '@/hooks/useKioskData';
import { PosterDisplay } from './PosterDisplay';
import { ConnectionStatus } from './ConnectionStatus';
import { TimeCard } from './TimeCard';
import { WeatherCard } from './WeatherCard';
import { TemperatureCard } from './TemperatureCard';
import { ProgressCard } from './ProgressCard';
import { DetailsCard } from './DetailsCard';

export function KioskLayout() {
  const { connected, posterUrl, error, progress, player, details, weather, temperature } = useKioskData();

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      <ConnectionStatus connected={connected} error={error} />
      
      {/* Poster Section - Fills available space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PosterDisplay posterUrl={posterUrl} />
      </div>
      
      {/* Tiles Section - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 space-y-3">
        {/* Row 1: Time & Weather */}
        <div className="grid grid-cols-2 gap-3">
          <TimeCard />
          <WeatherCard weather={weather} />
        </div>
        
        {/* Row 2: Temperature, Progress, Details */}
        <div className="grid grid-cols-3 gap-3">
          <TemperatureCard temperature={temperature} />
          <ProgressCard progress={progress} player={player} />
          <DetailsCard details={details} />
        </div>
      </div>
    </div>
  );
}
