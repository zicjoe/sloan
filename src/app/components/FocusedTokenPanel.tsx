import { AlertTriangle, Bot, Droplet, Shield, TrendingDown, TrendingUp, Twitter, Zap } from 'lucide-react';
import type { PredictionOpportunity } from '../types';
import { formatNumber, formatPrice } from '../lib/utils';
import { MakeCallComposer } from './MakeCallComposer';

interface FocusedTokenPanelProps {
  token: {
    id: string;
    slug: string;
    name: string;
    ticker: string;
    image: string;
    price: number;
    priceChange24h: number;
    volume24h?: number;
    marketCap?: number;
    liquidity?: number;
    category?: string;
    launchAge?: string;
    isAICreated?: boolean;
    isXMode?: boolean;
    isAntiSniper?: boolean;
    isTaxToken?: boolean;
    taxRate?: number;
    isPancake?: boolean;
    signalSummary?: string;
    reasonLine?: string;
    actionBias?: 'bullish' | 'bearish' | 'neutral';
  };
  opportunity?: PredictionOpportunity;
  onSubmitCall?: (call: { answer: 'yes' | 'no'; expiry: string; reason?: string }) => void;
}

function statusLabel(token: FocusedTokenPanelProps['token']) {
  if (token.isPancake) return 'Graduated';
  if ((token.liquidity || 0) > 90000) return 'Liquid';
  if (token.priceChange24h > 25) return 'Hot';
  if (token.launchAge?.includes('min') || token.launchAge?.includes('hour')) return 'Early';
  if (token.isTaxToken) return 'Risk';
  return undefined;
}

function callTypeLabel(callType?: PredictionOpportunity['callType']) {
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

export function FocusedTokenPanel({ token, opportunity, onSubmitCall }: FocusedTokenPanelProps) {
  const mechanicBadges = [
    token.isAICreated && { icon: Bot, label: 'AI Created', color: 'purple' },
    token.isXMode && { icon: Twitter, label: 'X Mode', color: 'blue' },
    token.isAntiSniper && { icon: Shield, label: 'Anti-Sniper', color: 'green' },
    token.isTaxToken && { icon: AlertTriangle, label: `Tax ${token.taxRate}%`, color: 'red' },
    token.isPancake && { icon: Droplet, label: 'Pancake', color: 'purple' },
  ].filter(Boolean) as Array<{ icon: any; label: string; color: string }>;
  const status = statusLabel(token);

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-card via-background-elevated to-card shadow-[0_0_30px_rgba(74,222,255,0.15)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      <div className="relative p-8">
        <div className="mb-6 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Prepared Call Setup</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
          <div>
            <div className="mb-6 flex items-start gap-4">
              <img src={token.image || 'https://placehold.co/96x96/111827/94a3b8?text=%24'} alt={token.name} className="h-16 w-16 rounded-full ring-2 ring-primary/20" />
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">{token.name}</h2>
                  <span className="text-lg text-muted-foreground">${token.ticker}</span>
                  {status ? <span className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{status}</span> : null}
                  {token.category ? <span className="rounded border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground">{token.category}</span> : null}
                </div>
                {mechanicBadges.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {mechanicBadges.map((badge, index) => {
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
                <div className="flex items-baseline gap-4">
                  <div className="font-mono text-3xl font-bold text-foreground">{formatPrice(token.price)}</div>
                  <div className={`flex items-center gap-1 text-lg font-medium ${token.priceChange24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {token.priceChange24h >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4">
              {typeof token.volume24h === 'number' ? <div className="rounded-lg border border-border bg-muted/30 p-3"><div className="mb-1 text-xs text-muted-foreground">24h Volume</div><div className="text-sm font-mono text-foreground">{formatNumber(token.volume24h)}</div></div> : null}
              {typeof token.marketCap === 'number' ? <div className="rounded-lg border border-border bg-muted/30 p-3"><div className="mb-1 text-xs text-muted-foreground">Market Cap</div><div className="text-sm font-mono text-foreground">{formatNumber(token.marketCap)}</div></div> : null}
              {typeof token.liquidity === 'number' ? <div className="rounded-lg border border-border bg-muted/30 p-3"><div className="mb-1 text-xs text-muted-foreground">Liquidity</div><div className="text-sm font-mono text-foreground">{formatNumber(token.liquidity)}</div></div> : null}
            </div>

            {opportunity ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-1 text-xs font-medium text-primary">AI Selected Call • {callTypeLabel(opportunity.callType)}</div>
                  <p className="text-sm leading-relaxed text-foreground">{opportunity.reasoningHint}</p>
                </div>
                {opportunity.whyNow ? <div className="rounded-lg border border-border bg-muted/30 p-4"><div className="mb-1 text-xs font-medium text-muted-foreground">Why this call fits now</div><p className="text-sm leading-relaxed text-foreground">{opportunity.whyNow}</p></div> : null}
              </div>
            ) : null}
          </div>

          <div className="lg:border-l lg:border-border lg:pl-8">
            <MakeCallComposer tokenSlug={token.slug} tokenName={token.name} opportunity={opportunity} onSubmit={onSubmitCall} />
          </div>
        </div>
      </div>
    </div>
  );
}
