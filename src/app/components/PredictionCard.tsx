import { Link } from 'react-router';
import { Prediction } from '../types';

interface PredictionCardProps {
  prediction: Prediction;
}

function getAnswerStyle(answer: 'yes' | 'no' | undefined) {
  return answer === 'yes'
    ? 'bg-success/10 text-success'
    : 'bg-destructive/10 text-destructive';
}

function getStatusStyle(status: Prediction['status']) {
  switch (status) {
    case 'correct':
      return 'bg-success/10 text-success';
    case 'incorrect':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-warning/10 text-warning';
  }
}

function callTypeLabel(callType?: Prediction['callType']) {
  switch (callType) {
    case 'volume':
      return 'Volume';
    case 'holders':
      return 'Holders';
    case 'price':
      return 'Price';
    case 'survival':
      return 'Momentum';
    case 'relative_strength':
      return 'Relative strength';
    case 'momentum':
    default:
      return 'Momentum';
  }
}

function answerLabel(prediction: Prediction) {
  if (prediction.binaryAnswer) return prediction.binaryAnswer === 'yes' ? 'Yes' : 'No';
  return prediction.prediction === 'moon' ? 'Yes' : 'No';
}

function fallbackQuestion(prediction: Prediction) {
  switch (prediction.callType) {
    case 'volume':
      return `Will ${prediction.tokenName}'s 24h volume increase over the next ${prediction.timeframe}?`;
    case 'holders':
      return `Will ${prediction.tokenName}'s holder count increase over the next ${prediction.timeframe}?`;
    case 'price':
      return `Will ${prediction.tokenName}'s price increase over the next ${prediction.timeframe}?`;
    case 'survival':
      return `Will ${prediction.tokenName} stay strong over the next ${prediction.timeframe}?`;
    default:
      return `${prediction.tokenName} prediction`;
  }
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const answer = prediction.binaryAnswer || (prediction.prediction === 'moon' ? 'yes' : 'no');
  return (
    <div className="p-4 rounded-lg bg-card border border-card-border">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Link to={`/dashboard/passport/${prediction.username}`} className="text-sm text-primary hover:underline">
            @{prediction.username}
          </Link>
          <p className="text-xs text-muted-foreground">
            {new Date(prediction.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={`px-2 py-1 rounded text-xs font-mono ${getAnswerStyle(answer)}`}>
            {answerLabel(prediction)}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(prediction.status)}`}>
            {prediction.status}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded-full bg-background-subtle border border-border">{callTypeLabel(prediction.callType)}</span>
          <span className="px-2 py-1 rounded-full bg-background-subtle border border-border">{prediction.confidence || 'medium'} confidence</span>
          <span className="px-2 py-1 rounded-full bg-background-subtle border border-border">{prediction.timeframe}</span>
        </div>

        <Link to={`/dashboard/token/${prediction.tokenSlug}`} className="text-foreground hover:text-primary transition-colors block text-sm leading-relaxed">
          {prediction.question || fallbackQuestion(prediction)}
        </Link>

        <p className="text-sm text-muted-foreground line-clamp-3">
          {prediction.reasoning}
        </p>

        {prediction.resolutionNote ? (
          <div className="p-3 rounded-lg bg-background-subtle border border-border text-sm text-foreground-muted">
            {prediction.resolutionNote}
          </div>
        ) : null}

        {typeof prediction.scoreAwarded === 'number' ? (
          <div className="text-xs text-muted-foreground font-mono">
            Score: {prediction.scoreAwarded >= 0 ? '+' : ''}{prediction.scoreAwarded}
          </div>
        ) : null}
      </div>
    </div>
  );
}
