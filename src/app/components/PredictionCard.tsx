import { Link } from 'react-router';
import { Prediction } from '../types';

interface PredictionCardProps {
  prediction: Prediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const getPredictionStyle = (type: string) => {
    switch (type) {
      case 'moon':
        return 'bg-success/10 text-success';
      case 'dump':
        return 'bg-destructive/10 text-destructive';
      case 'sideways':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-card-border">
      <div className="flex items-start justify-between mb-2">
        <div>
          <Link
            to={`/dashboard/passport/${prediction.username}`}
            className="text-sm text-primary hover:underline"
          >
            @{prediction.username}
          </Link>
          <p className="text-xs text-muted-foreground">
            {new Date(prediction.timestamp).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-mono ${getPredictionStyle(prediction.prediction)}`}>
          {prediction.prediction.toUpperCase()}
        </span>
      </div>

      <Link
        to={`/dashboard/token/${prediction.tokenSlug}`}
        className="text-foreground hover:text-primary transition-colors mb-2 block"
      >
        {prediction.tokenName} - ${prediction.targetPrice?.toFixed(4)} in {prediction.timeframe}
      </Link>

      <p className="text-sm text-muted-foreground line-clamp-2">
        {prediction.reasoning}
      </p>
    </div>
  );
}
