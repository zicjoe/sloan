import { Trophy, TrendingUp, Target, Award } from 'lucide-react';

interface LeaderboardPanelProps {
  userStats?: {
    rank?: number;
    accuracy: number;
    totalCalls: number;
    resolvedCalls: number;
    points: number;
  };
  topProphets?: Array<{
    rank: number;
    username: string;
    avatar?: string;
    accuracy: number;
    points: number;
    totalCalls: number;
  }>;
}

export function LeaderboardPanel({ userStats, topProphets }: LeaderboardPanelProps) {
  return (
    <div className="space-y-6">
      {/* Personal Stats */}
      {userStats && (
        <div className="p-5 rounded-lg bg-gradient-to-br from-card to-background-elevated border border-card-border">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Your Performance</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-xs text-muted-foreground mb-1">Accuracy</div>
              <div className="text-2xl font-bold text-primary">{userStats.accuracy}%</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Points</div>
              <div className="text-2xl font-bold text-foreground">{userStats.points.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Calls</div>
              <div className="text-lg font-mono text-foreground">{userStats.totalCalls}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Resolved</div>
              <div className="text-lg font-mono text-foreground">{userStats.resolvedCalls}</div>
            </div>
          </div>

          {userStats.rank && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Leaderboard Rank</span>
                <span className="text-sm font-bold text-primary">#{userStats.rank}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Prophets */}
      {topProphets && topProphets.length > 0 && (
        <div className="p-5 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-foreground">Top Prophets</h3>
          </div>

          <div className="space-y-2">
            {topProphets.map((prophet) => (
              <div
                key={prophet.rank}
                className="flex items-center gap-3 p-3 rounded-lg bg-background-elevated hover:bg-muted/30 transition-all cursor-pointer"
              >
                <div className={`
                  w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0
                  ${prophet.rank === 1 ? 'bg-warning/20 text-warning' : ''}
                  ${prophet.rank === 2 ? 'bg-muted/50 text-muted-foreground' : ''}
                  ${prophet.rank === 3 ? 'bg-orange-500/20 text-orange-400' : ''}
                  ${prophet.rank > 3 ? 'bg-muted/30 text-muted-foreground' : ''}
                `}>
                  {prophet.rank}
                </div>

                {prophet.avatar ? (
                  <img
                    src={prophet.avatar || 'https://placehold.co/64x64/111827/94a3b8?text=P'}
                    alt={prophet.username}
                    className="w-8 h-8 rounded-full ring-2 ring-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                    <span className="text-xs font-mono text-muted-foreground">
                      {prophet.username.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">{prophet.username}</div>
                  <div className="text-xs text-muted-foreground">{prophet.totalCalls} calls</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-success">{prophet.accuracy}%</div>
                  <div className="text-xs text-muted-foreground">{prophet.points.toLocaleString()} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
