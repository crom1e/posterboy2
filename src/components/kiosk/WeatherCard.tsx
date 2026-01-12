import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudFog,
  Moon,
  CloudSun,
  CloudMoon,
  Wind,
  CloudDrizzle,
  Droplets
} from 'lucide-react';
import { DataCard } from './DataCard';
import { WeatherData } from '@/hooks/useMqtt';

interface WeatherCardProps {
  weather: WeatherData | null;
}

// Home Assistant weather state to icon mapping
function getWeatherIcon(state: string) {
  const iconClass = "text-muted-foreground/70";
  const size = 36;
  
  switch (state) {
    case 'sunny':
      return <Sun size={size} className={iconClass} />;
    case 'clear-night':
      return <Moon size={size} className={iconClass} />;
    case 'partlycloudy':
      return <CloudSun size={size} className={iconClass} />;
    case 'cloudy':
      return <Cloud size={size} className={iconClass} />;
    case 'rainy':
      return <CloudRain size={size} className={iconClass} />;
    case 'pouring':
      return <CloudDrizzle size={size} className={iconClass} />;
    case 'snowy':
      return <CloudSnow size={size} className={iconClass} />;
    case 'snowy-rainy':
      return <CloudSnow size={size} className={iconClass} />;
    case 'fog':
      return <CloudFog size={size} className={iconClass} />;
    case 'lightning':
    case 'lightning-rainy':
      return <CloudLightning size={size} className={iconClass} />;
    case 'windy':
    case 'windy-variant':
      return <Wind size={size} className={iconClass} />;
    case 'hail':
      return <CloudDrizzle size={size} className={iconClass} />;
    default:
      return <Cloud size={size} className={iconClass} />;
  }
}

// Format state for display
function formatState(state: string): string {
  return state
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-3xl font-bold tracking-tight">
            {Math.round(weather.temperature)}°
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {formatState(weather.state)}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <Droplets size={12} />
              {weather.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind size={12} />
              {Math.round(weather.windSpeed)} km/h
            </span>
          </div>
        </div>
        {getWeatherIcon(weather.state)}
      </div>
    </DataCard>
  );
}
