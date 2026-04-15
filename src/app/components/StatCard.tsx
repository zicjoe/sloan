import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ icon, label, value, subtitle, trend }: StatCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-card-border">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-3xl text-foreground font-mono">{value}</p>
      {subtitle && (
        <p className={`text-xs mt-1 ${trend ? trendColors[trend] : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
