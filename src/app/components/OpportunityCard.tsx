import { TrendingUp, TrendingDown, AlertTriangle, Bot, Shield, Twitter, Droplet, Zap } from 'lucide-react';
import { formatPrice, formatNumber } from '../lib/utils';

interface OpportunityCardProps {
  token: {
    id: string;
    slug: string;
    name: string;
    ticker: string;
    image: string;
    price: number;
    priceChange24h: number;
    volume24h?: number;
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
  };
  onMakeCall?: (tokenSlug: string) => void;
}

export function OpportunityCard({ token, onMakeCall }: OpportunityCardProps) {
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

  const getOneMechanicBadge = () => {
    if (token.isAICreated) return { icon: Bot, label: 'AI Created', color: 'purple' };
    if (token.isXMode) return { icon: Twitter, label: 'X Mode', color: 'blue' };
    if (token.isAntiSniper) return { icon: Shield, label: 'Anti-Sniper', color: 'green' };
    if (token.isTaxToken) return { icon: AlertTriangle, label: `Tax ${token.taxRate}%`, color: 'red' };
    if (token.isPancake) return { icon: Droplet, label: 'Pancake', color: 'purple' };
    return null;
  };

  const mechanicBadge = getOneMechanicBadge();

  return (
    <div className="p-5 rounded-lg bg-card border border-card-border hover:border-primary/40 transition-all group">
      {/* Token Header */}
      <div className="flex items-start gap-3 mb-4">
        <img
          src={token.image || 'https://placehold.co/96x96/111827/94a3b8?text=%24'}
          alt={token.name}
          className="w-12 h-12 rounded-full ring-2 ring-border group-hover:ring-primary/30 transition-all"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{token.name}</h3>
            {statusBadge && (
              <span
                className={`
                  px-1.5 py-0.5 rounded text-xs font-medium shrink-0
                  ${statusBadge.color === 'success' ? 'bg-success/10 text-success' : ''}
                  ${statusBadge.color === 'primary' ? 'bg-primary/10 text-primary' : ''}
                  ${statusBadge.color === 'warning' ? 'bg-warning/10 text-warning' : ''}
                  ${statusBadge.color === 'secondary' ? 'bg-secondary/10 text-secondary' : ''}
                  ${statusBadge.color === 'destructive' ? 'bg-destructive/10 text-destructive' : ''}
                `}
              >
                {statusBadge.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">${token.ticker}</span>
            {token.category && (
              <span className="text-xs text-muted-foreground">• {token.category}</span>
            )}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3 mb-3">
        <div className="text-xl font-bold font-mono text-foreground">
          {formatPrice(token.price)}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          token.priceChange24h >= 0 ? 'text-success' : 'text-destructive'
        }`}>
          {token.priceChange24h >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-4 text-xs">
        {token.volume24h !== undefined && (
          <div>
            <span className="text-muted-foreground">Vol: </span>
            <span className="font-mono text-foreground">{formatNumber(token.volume24h)}</span>
          </div>
        )}
        {token.holders !== undefined && (
          <div>
            <span className="text-muted-foreground">Holders: </span>
            <span className="font-mono text-foreground">{formatNumber(token.holders)}</span>
          </div>
        )}
      </div>

      {/* Mechanic Badge */}
      {mechanicBadge && (
        <div className="mb-4">
          {(() => {
            const Icon = mechanicBadge.icon;
            return (
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded text-xs border
                  ${mechanicBadge.color === 'purple' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                  ${mechanicBadge.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                  ${mechanicBadge.color === 'green' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                  ${mechanicBadge.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                `}
              >
                <Icon className="w-3 h-3" />
                {mechanicBadge.label}
              </span>
            );
          })()}
        </div>
      )}

      {/* Signal Summary */}
      {token.signalSummary && (
        <div className="p-3 rounded bg-primary/5 border border-primary/10 mb-3">
          <p className="text-xs text-foreground leading-relaxed line-clamp-2">{token.signalSummary}</p>
        </div>
      )}

      {/* Reason Line */}
      {token.reasonLine && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground line-clamp-1">{token.reasonLine}</p>
        </div>
      )}

      {/* Make Call Action */}
      <button
        onClick={() => onMakeCall?.(token.slug)}
        className="w-full px-4 py-3 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all font-medium flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(74,222,255,0.3)]"
      >
        <Zap className="w-4 h-4" />
        Make Call
      </button>
    </div>
  );
}
