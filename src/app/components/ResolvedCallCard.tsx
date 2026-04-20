import { TrendingUp, TrendingDown, CheckCircle2, XCircle, Target, Award } from 'lucide-react';
import { timeAgo } from '../lib/utils';

interface ResolvedCallCardProps {
  call: {
    id: string;
    token: {
      name: string;
      ticker: string;
      image: string;
    };
    question: string;
    answer: 'yes' | 'no';
    confidence: number;
    result: 'correct' | 'incorrect' | 'expired';
    scoreAwarded: number;
    resolutionNote?: string;
    createdAt: string;
    resolvedAt: string;
    outcomeLabel?: string;
  };
}

export function ResolvedCallCard({ call }: ResolvedCallCardProps) {
  const getResultBadge = () => {
    if (call.result === 'correct') {
      return {
        icon: CheckCircle2,
        label: call.outcomeLabel || 'Correct',
        color: 'success',
        bgClass: 'bg-success/10 text-success border-success/20',
      };
    }
    if (call.result === 'incorrect') {
      return {
        icon: XCircle,
        label: call.outcomeLabel || 'Missed',
        color: 'destructive',
        bgClass: 'bg-destructive/10 text-destructive border-destructive/20',
      };
    }
    return {
      icon: XCircle,
      label: 'Expired',
      color: 'muted',
      bgClass: 'bg-muted/30 text-muted-foreground border-border',
    };
  };

  const resultBadge = getResultBadge();
  const ResultIcon = resultBadge.icon;

  return (
    <div className={`
      p-5 rounded-lg border transition-all
      ${call.result === 'correct' ? 'bg-success/5 border-success/20 hover:border-success/30' : ''}
      ${call.result === 'incorrect' ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/30' : ''}
      ${call.result === 'expired' ? 'bg-card border-card-border hover:border-border' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <img
          src={call.token.image || 'https://placehold.co/80x80/111827/94a3b8?text=%24'}
          alt={call.token.name}
          className="w-10 h-10 rounded-full ring-2 ring-border"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{call.token.name}</h3>
            <span className="text-sm text-muted-foreground">${call.token.ticker}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1 ${resultBadge.bgClass}`}>
              <ResultIcon className="w-3 h-3" />
              {resultBadge.label}
            </span>
            {call.scoreAwarded > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <Award className="w-3 h-3" />
                +{call.scoreAwarded}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-4">
        <p className="text-sm text-foreground leading-relaxed">{call.question}</p>
      </div>

      {/* Your Call Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Your Answer</div>
          <div className={`flex items-center gap-1 font-medium ${
            call.answer === 'yes' ? 'text-success' : 'text-destructive'
          }`}>
            {call.answer === 'yes' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {call.answer === 'yes' ? 'Yes' : 'No'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Confidence</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  call.result === 'correct' ? 'bg-success' : 'bg-muted-foreground'
                }`}
                style={{ width: `${call.confidence}%` }}
              />
            </div>
            <span className="text-sm font-mono text-foreground">{call.confidence}%</span>
          </div>
        </div>
      </div>

      {/* Resolution Note */}
      {call.resolutionNote && (
        <div className={`
          p-3 rounded-lg border mb-4
          ${call.result === 'correct' ? 'bg-success/5 border-success/20' : 'bg-muted/20 border-border'}
        `}>
          <div className="text-xs font-medium mb-1 flex items-center gap-1 text-foreground">
            <Target className="w-3 h-3" />
            Outcome
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{call.resolutionNote}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>Made {timeAgo(call.createdAt)}</div>
        <div>Resolved {timeAgo(call.resolvedAt)}</div>
      </div>
    </div>
  );
}
