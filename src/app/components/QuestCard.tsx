import { Target, Clock, Trophy, CheckCircle2 } from 'lucide-react';
import { Quest } from '../types';

interface QuestCardProps {
  quest: Quest;
}

const categoryStyles = {
  posting: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  prediction: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  meme: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  rivalry: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  recovery: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
};

export function QuestCard({ quest }: QuestCardProps) {
  return (
    <div className={`
      p-4 rounded-lg border transition-all
      ${quest.completed
        ? 'bg-success/5 border-success/20 opacity-75'
        : 'bg-card border-card-border hover:border-primary/40'
      }
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-foreground">{quest.title}</h3>
            {quest.completed && (
              <CheckCircle2 className="w-4 h-4 text-success" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{quest.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`
          px-2 py-1 rounded text-xs border capitalize
          ${categoryStyles[quest.category]}
        `}>
          {quest.category}
        </span>
        {quest.tokenSlug && (
          <span className="px-2 py-1 rounded text-xs bg-accent-dim text-muted-foreground font-mono">
            ${quest.tokenSlug.toUpperCase()}
          </span>
        )}
      </div>

      {!quest.completed && quest.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground font-mono">{quest.progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${quest.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <div className="flex items-center gap-4">
          {quest.deadline && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{new Date(quest.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 text-primary">
          <Trophy className="w-3 h-3" />
          <span className="text-sm font-mono">{quest.reward} XP</span>
        </div>
      </div>
    </div>
  );
}
