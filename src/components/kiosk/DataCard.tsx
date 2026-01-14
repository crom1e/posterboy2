import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DataCardProps {
  title: string;
  icon?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DataCard({ title, icon, headerRight, children, className }: DataCardProps) {
  return (
    <div
      className={cn(
        'bg-card/50 border border-border/50 rounded-xl p-4',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {headerRight}
      </div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}
