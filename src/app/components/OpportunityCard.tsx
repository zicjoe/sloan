import { AlertTriangle, Bot, Droplet, Shield, TrendingDown, TrendingUp, Twitter, Zap } from 'lucide-react';
import type { PredictionOpportunity, Token } from '../types';
import { formatNumber, formatPrice } from '../lib/utils';

interface OpportunityCardProps {
  token: Token;
  opportunity: PredictionOpportunity;
  onMakeCall?: (tokenSlug: string, opportunityId: string) => void;
}

function callTypeLabel(callType: PredictionOpportunity['callType']) {
  switch (callType) {
    case 'hold_strength':
      return 'Hold Strength';
    case 'outperform':
      return 'Outperform';
    case 'graduation':
      return 'Graduation';
    case 'breakdown':
      return 'Breakdown';
    case 'momentum':
    default:
      return 'Momentum';
  }
}

export function OpportunityCard({ token, opportunity, onMakeCall }: OpportunityCardProps) {
  const mechanicBadges = [
    token.isAICreated && { icon: Bot, label: 'AI Created', color: 'purple' },
    token.isXMode && { icon: Twitter, label: 'X Mode', color: 'blue' },
    token.isAntiSniper && { icon: Shield, label: 'Anti-Sniper', color: 'green' },
    token.isTaxToken && { icon: AlertTriangle, label: `Tax ${token.taxRate}%`, color: 'red' },
    token.isPancake && { icon: Droplet, label: 'Pancake', color: 'purple' },
  ].filter(Boolean) as Array<{ icon: any; label: string; color: string }>;

  return (
    <div className="rounded-lg border border-card-border bg-card p-5 transition-all hover:border-primary/40 group">
      <div className="mb-4 flex items-start gap-3">
        <img
          src={token.image || 'https://placehold.co/96x96/111827/94a3b8?text=%24'}
          alt={token.name}
          className="h-12 w-12 rounded-full ring-2 ring-border transition-all group-hover:ring-primary/30"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">{token.name}</h3>
            <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary shrink-0">
              {callTypeLabel(opportunity.callType)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>${token.ticker}</span>
            {token.category ? <span>• {token.category}</span> : null}
            {opportunity.tokenState ? <span>• {opportunity.tokenState}</span> : null}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-baseline gap-3">
        <div className="font-mono text-xl font-bold text-foreground">{formatPrice(token.price)}</div>
        <div className={`flex items-center gap-1 text-sm font-medium ${token.priceChange24h >= 0 ? 'text-success' : 'text-destructive'}`}>
          {token.priceChange24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Vol: </span>
          <span className="font-mono text-foreground">{formatNumber(token.volume24h || 0)}</span>
        </div>
        {typeof token.liquidity === 'number' ? (
          <div>
            <span className="text-muted-foreground">Liq: </span>
            <span className="font-mono text-foreground">{formatNumber(token.liquidity || 0)}</span>
          </div>
        ) : null}
      </div>

      <div className="mb-3 rounded border border-primary/10 bg-primary/5 p-3">
        <div className="mb-1 text-xs font-medium text-primary">AI Call Read</div>
        <p className="line-clamp-3 text-xs leading-relaxed text-foreground">{opportunity.reasoningHint}</p>
      </div>

      {opportunity.whyNow ? (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground line-clamp-2">{opportunity.whyNow}</p>
        </div>
      ) : null}

      {mechanicBadges.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {mechanicBadges.slice(0, 2).map((badge, index) => {
            const Icon = badge.icon;
            return (
              <span key={index} className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${badge.color === 'purple' ? 'border-purple-500/20 bg-purple-500/10 text-purple-400' : ''}${badge.color === 'blue' ? ' border-blue-500/20 bg-blue-500/10 text-blue-400' : ''}${badge.color === 'green' ? ' border-green-500/20 bg-green-500/10 text-green-400' : ''}${badge.color === 'red' ? ' border-red-500/20 bg-red-500/10 text-red-400' : ''}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
              </span>
            );
          })}
        </div>
      ) : null}

      <button
        onClick={() => onMakeCall?.(token.slug, opportunity.id)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground group-hover:shadow-[0_0_15px_rgba(74,222,255,0.3)]"
      >
        <Zap className="h-4 w-4" />
        Make Call
      </button>
    </div>
  );
}
