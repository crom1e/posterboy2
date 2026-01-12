import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';
import { DataCard } from './DataCard';
import { WeatherData } from '@/hooks/useMqtt';

interface WeatherCardProps {
  weather: WeatherData | null;
}

// Simple icon mapping based on condition keywords
function getWeatherIcon(condition: string) {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle')) return <CloudRain size={32} className="text-muted-foreground/50" />;
  if (lower.includes('snow')) return <CloudSnow size={32} className="text-muted-foreground/50" />;
  if (lower.includes('thunder') || lower.includes('storm')) return <CloudLightning size={32} className="text-muted-foreground/50" />;
  if (lower.includes('clear') || lower.includes('sunny')) return <Sun size={32} className="text-muted-foreground/50" />;
  return <Cloud size={32} className="text-muted-foreground/50" />;
}

export function WeatherCard({ weather }: WeatherCardProps) {
  if (!weather) {
    return (
      <DataCard title="Weather" icon={<Cloud size={16} />}>
        <div className="flex items-center justify-center py-2">
          <span className="text-muted-foreground">--</span>
        </div>
      </DataCard>
    );
  }

  return (
    <DataCard title="Weather" icon={<Cloud size={16} />}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">{weather.temp}°C</div>
          <div className="text-sm text-muted-foreground">{weather.condition}</div>
        </div>
        {getWeatherIcon(weather.condition)}
      </div>
    </DataCard>
  );
}
