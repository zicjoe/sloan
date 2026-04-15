import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router';
import { Token } from '../types';

interface TokenCardProps {
  token: Token;
  showDetails?: boolean;
}

export function TokenCard({ token, showDetails = true }: TokenCardProps) {
  const isPositive = token.priceChange24h > 0;
  const isNegative = token.priceChange24h < 0;

  const MomentumIcon = token.momentum === 'rising' ? TrendingUp :
                       token.momentum === 'falling' ? TrendingDown : Minus;

  return (
    <Link
      to={`/dashboard/token/${token.slug}`}
      className="block p-4 rounded-lg bg-card border border-card-border hover:border-primary/40 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-foreground group-hover:text-primary transition-colors">
              {token.name}
            </h3>
            <span className="px-2 py-0.5 rounded bg-accent-dim text-xs text-muted-foreground font-mono">
              ${token.ticker}
            </span>
          </div>
          <p className="text-2xl mt-1 font-mono text-foreground">
            ${token.price.toFixed(4)}
          </p>
        </div>

        <div className={`
          flex items-center gap-1 px-2 py-1 rounded text-sm font-mono
          ${isPositive ? 'bg-success/10 text-success' : ''}
          ${isNegative ? 'bg-destructive/10 text-destructive' : ''}
          ${!isPositive && !isNegative ? 'bg-muted text-muted-foreground' : ''}
        `}>
          {isPositive && <TrendingUp className="w-3 h-3" />}
          {isNegative && <TrendingDown className="w-3 h-3" />}
          {token.priceChange24h > 0 && '+'}
          {token.priceChange24h.toFixed(1)}%
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Market Cap</p>
            <p className="text-sm font-mono text-foreground">
              ${(token.marketCap / 1000000).toFixed(1)}M
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">24h Vol</p>
            <p className="text-sm font-mono text-foreground">
              ${(token.volume24h / 1000000).toFixed(1)}M
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Holders</p>
            <p className="text-sm font-mono text-foreground">
              {token.holders.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Momentum</p>
            <div className="flex items-center gap-1">
              <MomentumIcon className="w-3 h-3 text-primary" />
              <p className="text-sm text-foreground capitalize">{token.momentum}</p>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}
