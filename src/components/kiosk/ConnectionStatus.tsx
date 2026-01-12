import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  connected: boolean;
  error: string | null;
}

export function ConnectionStatus({ connected, error }: ConnectionStatusProps) {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-2">
      <div
        className={cn(
          'w-3 h-3 rounded-full',
          connected ? 'bg-green-500' : 'bg-destructive',
          connected && 'animate-pulse'
        )}
      />
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
