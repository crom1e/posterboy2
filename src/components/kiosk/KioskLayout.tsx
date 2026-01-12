import { useMqtt } from '@/hooks/useMqtt';
import { PosterDisplay } from './PosterDisplay';
import { ConnectionStatus } from './ConnectionStatus';
import { TimeCard } from './TimeCard';
import { WeatherCard } from './WeatherCard';
import { SensorCards } from './SensorCards';

export function KioskLayout() {
  const { connected, posterUrl, error } = useMqtt();

  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col">
      <ConnectionStatus connected={connected} error={error} />
      
      {/* Poster Section - Top aligned, dynamic height */}
      <PosterDisplay posterUrl={posterUrl} />
      
      {/* Content Section - Fills remaining space */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <TimeCard />
          <WeatherCard />
        </div>
        <SensorCards />
      </div>
    </div>
  );
}
