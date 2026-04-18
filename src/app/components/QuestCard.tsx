import { Target, Clock, Trophy, CheckCircle2, Users, Sparkles } from 'lucide-react';
import { Quest } from '../types';

interface QuestCardProps {
  quest: Quest;
  onSelect?: (quest: Quest) => void;
  selected?: boolean;
}

const categoryStyles = {
  posting: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  prediction: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  meme: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  rivalry: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  recovery: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
};

const difficultyStyles = {
  easy: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function QuestCard({ quest, onSelect, selected = false }: QuestCardProps) {
  const interactive = Boolean(onSelect);

  return (
    <div
      onClick={() => onSelect?.(quest)}
      className={`
        p-4 rounded-lg border transition-all
        ${quest.completed
          ? 'bg-success/5 border-success/20 opacity-90'
          : selected
            ? 'bg-primary/5 border-primary/40 shadow-[0_0_0_1px_rgba(99,102,241,0.15)]'
            : 'bg-card border-card-border hover:border-primary/40'
        }
        ${interactive ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-foreground">{quest.title}</h3>
            {quest.completed && <CheckCircle2 className="w-4 h-4 text-success" />}
            {quest.joined && !quest.completed && (
              <span className="px-2 py-0.5 rounded-full text-[11px] border bg-primary/10 text-primary border-primary/20">
                joined
              </span>
            )}
            {quest.status === 'pending_review' && (
              <span className="px-2 py-0.5 rounded-full text-[11px] border bg-warning/10 text-warning border-warning/20">
                pending review
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{quest.description}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 text-primary shrink-0">
          <Trophy className="w-3 h-3" />
          <span className="text-sm font-mono">{quest.reward} XP</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`px-2 py-1 rounded text-xs border capitalize ${categoryStyles[quest.category]}`}>
          {quest.category}
        </span>
        {quest.difficulty && (
          <span className={`px-2 py-1 rounded text-xs border capitalize ${difficultyStyles[quest.difficulty]}`}>
            {quest.difficulty}
          </span>
        )}
        {quest.tokenSlug && (
          <span className="px-2 py-1 rounded text-xs bg-accent-dim text-muted-foreground font-mono">
            ${quest.tokenSlug.toUpperCase()}
          </span>
        )}
      </div>

      {quest.missionBrief && (
        <div className="mb-3 rounded-lg bg-background-subtle p-3 border border-border-subtle">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Mission Brief</span>
          </div>
          <p className="text-sm text-foreground-muted line-clamp-2">{quest.missionBrief}</p>
        </div>
      )}

      {!quest.completed && quest.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground font-mono">{quest.progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${quest.progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border-subtle gap-3 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          {quest.deadline && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{new Date(quest.deadline).toLocaleDateString()}</span>
            </div>
          )}
          {quest.participants !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{quest.participants} in mission</span>
            </div>
          )}
        </div>
        {!interactive && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="w-3 h-3" />
            <span>{quest.proofType || 'proof'} quest</span>
          </div>
        )}
      </div>
    </div>
  );
}
