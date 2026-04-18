import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router';
import { Token } from '../types';
import { formatCount, formatPercent, formatUsd } from '../lib/format';

interface TokenCardProps {
  token: Token;
  showDetails?: boolean;
}

function hasMarketFields(token: Token) {
  return [token.price, token.marketCap, token.volume24h, token.holders].some((value) => Number.isFinite(value) && value > 0);
}

function deriveTicker(token: Token) {
  const raw = (token.ticker || '').trim().toUpperCase();
  const generic = new Set(['BNB', 'WBNB', 'ETH', 'WETH', 'USDT', 'USDC']);
  if (raw && !generic.has(raw) && /^[A-Z0-9]{2,10}$/.test(raw)) return raw;

  const slugHead = (token.slug || '').split('-').find(Boolean)?.replace(/[^a-zA-Z0-9]/g, '') || '';
  if (slugHead) return slugHead.slice(0, 6).toUpperCase();

  const nameLetters = (token.name || '').replace(/[^a-zA-Z0-9]/g, '');
  if (nameLetters) return nameLetters.slice(0, 6).toUpperCase();

  return 'TOKEN';
}

export function TokenCard({ token, showDetails = true }: TokenCardProps) {
  const isPositive = token.priceChange24h > 0;
  const isNegative = token.priceChange24h < 0;
  const displayTicker = deriveTicker(token);

  const MomentumIcon = token.momentum === 'rising' ? TrendingUp :
                       token.momentum === 'falling' ? TrendingDown : Minus;
  const showPriceChange = Number.isFinite(token.priceChange24h) && Math.abs(token.priceChange24h) > 0.01;
  const hasFields = hasMarketFields(token);

  return (
    <Link
      to={`/dashboard/token/${token.slug}`}
      className="block p-4 rounded-lg bg-card border border-card-border hover:border-primary/40 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-foreground group-hover:text-primary transition-colors">
              {token.name}
            </h3>
            <span className="px-2 py-0.5 rounded bg-accent-dim text-xs text-muted-foreground font-mono">
              ${displayTicker}
            </span>
            {token.sourceRankLabel && (
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] uppercase tracking-[0.18em]">
                {token.sourceRankLabel}
              </span>
            )}
          </div>
          <p className="text-2xl mt-1 font-mono text-foreground">
            {token.price > 0 ? formatUsd(token.price, { compact: false }) : (hasFields ? 'Live metrics only' : 'Awaiting market fields')}
          </p>
        </div>

        <div className={`
          flex items-center gap-1 px-2 py-1 rounded text-sm font-mono
          ${isPositive ? 'bg-success/10 text-success' : ''}
          ${isNegative ? 'bg-destructive/10 text-destructive' : ''}
          ${!isPositive && !isNegative ? 'bg-muted text-muted-foreground' : ''}
        `}>
          {showPriceChange ? (
            <>
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {formatPercent(token.priceChange24h, { showPlus: true })}
            </>
          ) : (
            <>
              <Minus className="w-3 h-3" />
              Live
            </>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Market Cap</p>
            <p className="text-sm font-mono text-foreground">
              {formatUsd(token.marketCap)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">24h Vol</p>
            <p className="text-sm font-mono text-foreground">
              {formatUsd(token.volume24h)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Holders</p>
            <p className="text-sm font-mono text-foreground">
              {formatCount(token.holders)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Momentum</p>
            <p className="text-sm font-mono text-foreground inline-flex items-center gap-1 capitalize">
              <MomentumIcon className="w-3.5 h-3.5" />
              {token.momentum}
            </p>
          </div>
        </div>
      )}
    </Link>
  );
}
