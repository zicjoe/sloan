import { TrendingUp, TrendingDown, AlertTriangle, Zap, Shield, Bot, Twitter, Droplet } from 'lucide-react';
import { MakeCallComposer } from './MakeCallComposer';
import { formatPrice, formatNumber } from '../lib/utils';

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
    holders?: number;
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
  onSubmitCall?: (call: {
    answer: 'yes' | 'no';
    confidence: number;
    expiry: string;
    reason?: string;
  }) => void;
}

export function FocusedTokenPanel({ token, onSubmitCall }: FocusedTokenPanelProps) {
  const getStatusBadge = () => {
    if (token.launchAge && token.launchAge.includes('min')) return { label: 'Early', color: 'success' };
    if (token.launchAge && (token.launchAge.includes('hour') || token.launchAge.includes('day'))) {
      const hours = token.launchAge.includes('hour') ? parseInt(token.launchAge) : parseInt(token.launchAge) * 24;
      if (hours < 48) return { label: 'Early', color: 'success' };
    }
    if (token.volume24h && token.volume24h > 5000000) return { label: 'Liquid', color: 'primary' };
    if (token.priceChange24h > 50) return { label: 'Hot', color: 'warning' };
    if (token.isPancake) return { label: 'Graduated', color: 'secondary' };
    if (token.isTaxToken) return { label: 'Risk', color: 'destructive' };
    return null;
  };

  const statusBadge = getStatusBadge();

  const mechanicBadges = [
    token.isAICreated && { icon: Bot, label: 'AI Created', color: 'purple' },
    token.isXMode && { icon: Twitter, label: 'X Mode', color: 'blue' },
    token.isAntiSniper && { icon: Shield, label: 'Anti-Sniper', color: 'green' },
    token.isTaxToken && { icon: AlertTriangle, label: `Tax ${token.taxRate}%`, color: 'red' },
    token.isPancake && { icon: Droplet, label: 'Pancake', color: 'purple' },
  ].filter(Boolean);

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-card via-background-elevated to-card shadow-[0_0_30px_rgba(74,222,255,0.15)]">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="relative p-8">
        {/* Header indicator */}
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Make Your Call</span>
        </div>

        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Token Information */}
          <div>
            {/* Token Identity */}
            <div className="flex items-start gap-4 mb-6">
              <img
                src={token.image || 'https://placehold.co/96x96/111827/94a3b8?text=%24'}
                alt={token.name}
                className="w-16 h-16 rounded-full ring-2 ring-primary/20"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">{token.name}</h2>
                  <span className="text-lg text-muted-foreground">${token.ticker}</span>
                  {statusBadge && (
                    <span
                      className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${statusBadge.color === 'success' ? 'bg-success/10 text-success border border-success/20' : ''}
                        ${statusBadge.color === 'primary' ? 'bg-primary/10 text-primary border border-primary/20' : ''}
                        ${statusBadge.color === 'warning' ? 'bg-warning/10 text-warning border border-warning/20' : ''}
                        ${statusBadge.color === 'secondary' ? 'bg-secondary/10 text-secondary border border-secondary/20' : ''}
                        ${statusBadge.color === 'destructive' ? 'bg-destructive/10 text-destructive border border-destructive/20' : ''}
                      `}
                    >
                      {statusBadge.label}
                    </span>
                  )}
                  {token.category && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-muted/50 text-muted-foreground border border-border">
                      {token.category}
                    </span>
                  )}
                </div>

                {/* Mechanic Badges */}
                {mechanicBadges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mechanicBadges.map((badge: any, index) => {
                      const Icon = badge.icon;
                      return (
                        <span
                          key={index}
                          className={`
                            inline-flex items-center gap-1 px-2 py-1 rounded text-xs border
                            ${badge.color === 'purple' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                            ${badge.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                            ${badge.color === 'green' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                            ${badge.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                          `}
                        >
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Price and Stats */}
                <div className="flex items-baseline gap-4">
                  <div className="text-3xl font-bold font-mono text-foreground">
                    {formatPrice(token.price)}
                  </div>
                  <div className={`flex items-center gap-1 text-lg font-medium ${
                    token.priceChange24h >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {token.priceChange24h >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {token.volume24h !== undefined && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">24h Volume</div>
                  <div className="text-sm font-mono text-foreground">{formatNumber(token.volume24h)}</div>
                </div>
              )}
              {token.marketCap !== undefined && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                  <div className="text-sm font-mono text-foreground">{formatNumber(token.marketCap)}</div>
                </div>
              )}
              {token.holders !== undefined && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Holders</div>
                  <div className="text-sm font-mono text-foreground">{formatNumber(token.holders)}</div>
                </div>
              )}
            </div>

            {/* Signal Intelligence */}
            <div className="space-y-3">
              {token.signalSummary && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="text-xs text-primary font-medium mb-1">AI Signal</div>
                  <p className="text-sm text-foreground leading-relaxed">{token.signalSummary}</p>
                </div>
              )}
              {token.reasonLine && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="text-xs text-muted-foreground font-medium mb-1">Context</div>
                  <p className="text-sm text-foreground leading-relaxed">{token.reasonLine}</p>
                </div>
              )}
            </div>
          </div>

          {/* Make Call Composer */}
          <div className="lg:border-l lg:border-border lg:pl-8">
            <MakeCallComposer
              tokenSlug={token.slug}
              tokenName={token.name}
              onSubmit={onSubmitCall}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
