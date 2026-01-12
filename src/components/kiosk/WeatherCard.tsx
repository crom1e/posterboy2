import { Cloud } from 'lucide-react';
import { DataCard } from './DataCard';

export function WeatherCard() {
  // Mock weather data
  return (
    <DataCard title="Weather" icon={<Cloud size={16} />}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">18°C</div>
          <div className="text-sm text-muted-foreground">Partly Cloudy</div>
        </div>
        <Cloud size={48} className="text-muted-foreground/50" />
      </div>
    </DataCard>
  );
}
