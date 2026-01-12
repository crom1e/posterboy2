import { Thermometer } from 'lucide-react';
import { DataCard } from './DataCard';

interface TemperatureCardProps {
  temperature: string | null;
}

export function TemperatureCard({ temperature }: TemperatureCardProps) {
  // Format temperature - add °C if not already present
  const formatTemp = (temp: string | null) => {
    if (!temp) return '--';
    if (temp.includes('°')) return temp;
    return `${temp}°C`;
  };

  return (
    <DataCard title="Temperature" icon={<Thermometer size={16} />}>
      <div className="flex flex-col items-center justify-center py-1">
        <div className="text-2xl font-bold">{formatTemp(temperature)}</div>
        <div className="text-xs text-muted-foreground">Indoor</div>
      </div>
    </DataCard>
  );
}
