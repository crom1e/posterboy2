import { Thermometer, Droplets, Lightbulb } from 'lucide-react';
import { DataCard } from './DataCard';

export function SensorCards() {
  // Mock sensor data
  const sensors = [
    { title: 'Temperature', icon: <Thermometer size={16} />, value: '22.4°C', subtitle: 'Living Room' },
    { title: 'Humidity', icon: <Droplets size={16} />, value: '45%', subtitle: 'Indoor' },
    { title: 'Lights', icon: <Lightbulb size={16} />, value: '3 On', subtitle: '5 Total' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {sensors.map((sensor) => (
        <DataCard key={sensor.title} title={sensor.title} icon={sensor.icon}>
          <div className="text-2xl font-bold">{sensor.value}</div>
          <div className="text-xs text-muted-foreground">{sensor.subtitle}</div>
        </DataCard>
      ))}
    </div>
  );
}
