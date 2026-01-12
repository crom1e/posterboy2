import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { DataCard } from './DataCard';

export function TimeCard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <DataCard title="Time" icon={<Clock size={16} />}>
      <div className="text-4xl font-bold tracking-tight">{timeString}</div>
      <div className="text-sm text-muted-foreground mt-1">{dateString}</div>
    </DataCard>
  );
}
