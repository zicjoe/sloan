import { TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';
import { formatPrice, timeAgo } from '../lib/utils';

interface ActiveCallCardProps {
  call: {
    id: string;
    token: {
      name: string;
      ticker: string;
      image: string;
      currentPrice?: number;
    };
    question: string;
    answer: 'yes' | 'no';
    confidence: number;
    expiry: string;
    createdAt: string;
    baselinePrice?: number;
    baselineVolume?: number;
    baselineHolders?: number;
  };
}

export function ActiveCallCard({ call }: ActiveCallCardProps) {
  const getTimeRemaining = () => {
    const expiryMap: { [key: string]: number } = {
      '24h': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '14d': 14 * 24 * 60 * 60 * 1000,
    };

    const createdTime = new Date(call.createdAt).getTime();
    const expiryTime = createdTime + (expiryMap[call.expiry] || 24 * 60 * 60 * 1000);
    const now = Date.now();
    const remaining = expiryTime - now;

    if (remaining <= 0) return 'Expiring soon';

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const priceChange = call.baselinePrice && call.token.currentPrice
    ? ((call.token.currentPrice - call.baselinePrice) / call.baselinePrice) * 100
    : null;

  return (
    <div className="p-5 rounded-lg bg-card border border-card-border hover:border-primary/30 transition-all">
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
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning border border-warning/20">
              Pending
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getTimeRemaining()}
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-4">
        <p className="text-sm text-foreground leading-relaxed">{call.question}</p>
      </div>

      {/* Your Call */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Your Call</div>
          <div className={`flex items-center gap-1 font-medium ${
            call.answer === 'yes' ? 'text-success' : 'text-destructive'
          }`}>
            {call.answer === 'yes' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {call.answer === 'yes' ? 'Yes - Bullish' : 'No - Bearish'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Confidence</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${call.confidence}%` }}
              />
            </div>
            <span className="text-sm font-mono text-foreground">{call.confidence}%</span>
          </div>
        </div>
      </div>

      {/* Baseline Metrics */}
      {(call.baselinePrice || call.baselineVolume || call.baselineHolders) && (
        <div className="p-3 rounded-lg bg-background-elevated/50 border border-border space-y-2">
          <div className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Baseline Metrics
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {call.baselinePrice && (
              <>
                <span className="text-muted-foreground">Entry Price:</span>
                <span className="font-mono text-foreground">{formatPrice(call.baselinePrice)}</span>
              </>
            )}
            {call.token.currentPrice && call.baselinePrice && (
              <>
                <span className="text-muted-foreground">Current Price:</span>
                <span className="font-mono text-foreground">{formatPrice(call.token.currentPrice)}</span>
              </>
            )}
            {priceChange !== null && (
              <>
                <span className="text-muted-foreground">Price Change:</span>
                <span className={`font-mono font-medium ${priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Made {timeAgo(call.createdAt)} • Expires in {call.expiry}
        </div>
      </div>
    </div>
  );
}
