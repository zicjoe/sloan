import { Link } from 'react-router';
import { Award } from 'lucide-react';
import { Prophet } from '../types';

interface ProphetRowProps {
  prophet: Prophet;
  rank?: number;
  variant?: 'compact' | 'detailed';
}

export function ProphetRow({ prophet, rank, variant = 'compact' }: ProphetRowProps) {
  const isTopThree = rank !== undefined && rank < 3;

  const getRankBadgeStyle = (position: number) => {
    if (position === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    if (position === 1) return 'bg-gradient-to-br from-gray-300 to-gray-500';
    if (position === 2) return 'bg-gradient-to-br from-orange-400 to-orange-600';
    return 'bg-gradient-to-br from-primary to-secondary';
  };

  if (variant === 'compact') {
    return (
      <Link
        to={`/dashboard/passport/${prophet.username}`}
        className="flex items-center justify-between p-3 rounded-lg bg-card border border-card-border hover:border-primary/40 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm">
            #{prophet.rank}
          </div>
          <div>
            <p className="text-sm text-foreground">{prophet.username}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {prophet.accuracy.toFixed(1)}% accurate
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-foreground font-mono">{prophet.streak}</p>
          <p className="text-xs text-muted-foreground">streak</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/dashboard/passport/${prophet.username}`}
      className={`
        flex items-center justify-between p-4 rounded-lg border transition-all
        ${isTopThree
          ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20'
          : 'bg-background-subtle border-border hover:border-primary/40'
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${rank !== undefined ? getRankBadgeStyle(rank) : 'bg-gradient-to-br from-primary to-secondary'}`}>
          #{prophet.rank}
        </div>
        <div>
          <p className="text-foreground">{prophet.username}</p>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-muted-foreground">
              {prophet.correctPredictions}/{prophet.totalPredictions} correct
            </span>
            <span className="text-sm text-primary font-mono">
              {prophet.accuracy.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-warning mb-1">
          <Award className="w-4 h-4" />
          <span className="text-lg font-mono">{prophet.streak}</span>
        </div>
        <p className="text-xs text-muted-foreground">streak</p>
      </div>
    </Link>
  );
}
