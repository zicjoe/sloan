import { TrendingUp, TrendingDown, Clock, Shield, Zap, Target } from 'lucide-react';
import { Link } from 'react-router';
import type { Token } from '../types';
import { formatCount, formatPercent, formatUsd } from '../lib/format';

interface EnhancedTokenCardProps {
  token: Token;
  variant?: 'hot' | 'early' | 'liquid' | 'graduated' | 'risk' | 'default';
}

function getVariantStyle(variant: NonNullable<EnhancedTokenCardProps['variant']>) {
  switch (variant) {
    case 'hot':
      return 'border-warning/40 bg-gradient-to-br from-warning/5 to-transparent';
    case 'early':
      return 'border-success/40 bg-gradient-to-br from-success/5 to-transparent';
    case 'liquid':
      return 'border-primary/40 bg-gradient-to-br from-primary/5 to-transparent';
    case 'graduated':
      return 'border-secondary/40 bg-gradient-to-br from-secondary/5 to-transparent';
    case 'risk':
      return 'border-destructive/40 bg-gradient-to-br from-destructive/5 to-transparent';
    default:
      return 'border-card-border bg-card';
  }
}

function getVariantBadge(variant: NonNullable<EnhancedTokenCardProps['variant']>) {
  switch (variant) {
    case 'hot':
      return { label: 'Hot', color: 'bg-warning/10 text-warning border-warning/20' };
    case 'early':
      return { label: 'Early', color: 'bg-success/10 text-success border-success/20' };
    case 'liquid':
      return { label: 'Liquid', color: 'bg-primary/10 text-primary border-primary/20' };
    case 'graduated':
      return { label: 'Graduated', color: 'bg-secondary/10 text-secondary border-secondary/20' };
    case 'risk':
      return { label: 'Risk', color: 'bg-destructive/10 text-destructive border-destructive/20' };
    default:
      return null;
  }
}

export function EnhancedTokenCard({ token, variant = 'default' }: EnhancedTokenCardProps) {
  const isPositive = (token.priceChange24h || 0) >= 0;
  const variantBadge = getVariantBadge(variant);

  return (
    <div className={`relative p-4 rounded-xl border transition-all hover:border-primary/60 group ${getVariantStyle(variant)}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 border border-border overflow-hidden">
          {token.image ? (
            <img src={token.image} alt={token.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{(token.ticker || token.name || 'TK').slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Link to={`/dashboard/token/${token.slug}`} className="text-foreground group-hover:text-primary transition-colors truncate">
              {token.name}
            </Link>
            <span className="text-xs text-muted-foreground font-mono">${token.ticker}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {variantBadge && (
              <span className={`px-2 py-0.5 rounded text-xs border ${variantBadge.color}`}>
                {variantBadge.label}
              </span>
            )}
            {token.category && (
              <span className="px-2 py-0.5 rounded text-xs bg-muted/50 text-muted-foreground border border-border">
                {token.category}
              </span>
            )}
            {token.isAICreated && (
              <span className="px-2 py-0.5 rounded text-xs bg-chart-1/10 text-chart-1 border border-chart-1/20 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                AI
              </span>
            )}
            {(token.isPancake || token.listedPancake) && (
              <span className="px-2 py-0.5 rounded text-xs bg-chart-3/10 text-chart-3 border border-chart-3/20">
                Pancake
              </span>
            )}
            {token.isTaxToken && (
              <span className="px-2 py-0.5 rounded text-xs bg-destructive/10 text-destructive border border-destructive/20">
                Tax {token.taxRate || 5}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xl font-mono text-foreground">{formatUsd(token.price, { compact: false, empty: '—', maxTinyDecimals: 12 })}</span>
        <span className={`flex items-center gap-1 text-sm font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(token.priceChange24h, { showPlus: true, digits: 1 })}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-border-subtle">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Volume</p>
          <p className="text-sm font-mono text-foreground">{formatUsd(token.volume24h, { empty: '—' })}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">MCap</p>
          <p className="text-sm font-mono text-foreground">{formatUsd(token.marketCap, { empty: '—' })}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Holders</p>
          <p className="text-sm font-mono text-foreground">{formatCount(token.holders, { empty: '—' })}</p>
        </div>
      </div>

      <div className="mb-3 min-h-[72px]">
        <p className="text-sm text-foreground leading-relaxed line-clamp-2">
          {token.signalSummary || 'Sloan is still reading this setup.'}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {token.reasonLine || 'Live sync is building the next read.'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to={`/dashboard/prophets?token=${encodeURIComponent(token.slug)}`}
          className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-center text-sm font-medium"
        >
          Make Call
        </Link>

        {token.hasQuest ? (
          <Link
            to={`/dashboard/quests?token=${encodeURIComponent(token.slug)}`}
            className="px-3 py-2 rounded-lg bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-all text-sm flex items-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5" />
            Quest Live
          </Link>
        ) : (
          <div className="px-3 py-2 rounded-lg bg-muted/10 text-muted-foreground border border-border text-sm flex items-center gap-1.5 opacity-50">
            <Target className="w-3.5 h-3.5" />
            No Quest
          </div>
        )}
      </div>

      {(token.isXMode || token.isAntiSniper || token.launchAge) && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border-subtle flex-wrap">
          {token.launchAge && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {token.launchAge}
            </div>
          )}
          {token.isXMode && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-chart-2/10 text-chart-2 text-xs border border-chart-2/20">
              <Shield className="w-3 h-3" />
              X Mode
            </div>
          )}
          {token.isAntiSniper && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-chart-4/10 text-chart-4 text-xs border border-chart-4/20">
              <Shield className="w-3 h-3" />
              Anti-Sniper
            </div>
          )}
        </div>
      )}
    </div>
  );
}
