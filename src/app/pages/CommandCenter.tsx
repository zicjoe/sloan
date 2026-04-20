import type { ReactNode } from 'react';
import { Search, RefreshCw, TrendingUp, Rocket, Droplet, GraduationCap, Megaphone, AlertTriangle, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { EnhancedTokenCard } from '../components/EnhancedTokenCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingState';
import { useApi } from '../hooks/useApi';
import { tokenApi, questApi } from '../services/api';
import type { Quest, Token } from '../types';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Tokens' },
  { value: 'ai', label: 'AI Only' },
  { value: 'meme', label: 'Meme Only' },
  { value: 'liquid', label: 'Liquid Only' },
  { value: 'quest', label: 'With Quest' },
];

function timeAgo(timestamp?: string) {
  if (!timestamp) return undefined;
  const diff = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(diff) || diff < 0) return undefined;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

function inferCategory(token: Token) {
  const source = `${token.category || ''} ${token.name} ${token.narrativeSummary || ''} ${token.fourMemeStatus || ''}`.toLowerCase();
  if (source.includes('ai') || source.includes('agent') || source.includes('bot') || source.includes('terminal')) return 'AI';
  if (source.includes('defi') || source.includes('yield') || source.includes('swap') || source.includes('liquidity')) return 'DeFi';
  if (source.includes('game') || source.includes('play')) return 'Games';
  return token.category || 'Meme';
}

function inferFlags(token: Token) {
  const source = `${token.name} ${token.narrativeSummary || ''} ${token.fourMemeStatus || ''} ${token.sourceRankLabel || ''}`.toLowerCase();
  return {
    isPancake: Boolean(token.isPancake || token.listedPancake || source.includes('pancake') || source.includes('dex') || source.includes('trade')),
    isAICreated: Boolean(token.isAICreated ?? inferCategory(token) === 'AI'),
    isXMode: Boolean(token.isXMode ?? source.includes('x mode')),
    isAntiSniper: Boolean(token.isAntiSniper ?? (source.includes('anti') && source.includes('sniper'))),
    isTaxToken: Boolean(token.isTaxToken ?? source.includes('tax')),
    taxRate: token.taxRate ?? ((token.isTaxToken || source.includes('tax')) ? 5 : undefined),
  };
}

function deriveSignal(token: Token, questCount: number): Partial<Token> {
  const price = Number(token.priceChange24h || 0);
  const volume = Number(token.volume24h || 0);
  const mcap = Number(token.marketCap || 0);
  const holders = Number(token.holders || 0);
  const rank = (token.sourceRankLabel || '').toUpperCase();
  const category = inferCategory(token);
  const { isPancake, isAICreated, isXMode, isAntiSniper, isTaxToken, taxRate } = inferFlags(token);
  const isFresh = rank.includes('NEW') || (!!token.lastSyncedAt && ((Date.now() - new Date(token.lastSyncedAt).getTime()) < 48 * 60 * 60 * 1000));

  let signalSummary = 'Live token context is building inside Sloan.';
  let reasonLine = 'Watch the next sync for a clearer read.';
  let actionBias: Token['actionBias'] = 'neutral';

  if (isPancake && volume > 0) {
    signalSummary = 'Graduated token with secondary-market flow already active.';
    reasonLine = 'Pancake traded stage is live.';
    actionBias = price >= 0 ? 'bullish' : 'neutral';
  } else if (price > 25 || rank.includes('HOT')) {
    signalSummary = 'Strong active heat and movement. Attention is already here.';
    reasonLine = 'Momentum is live and the token is pulling fresh eyes.';
    actionBias = 'bullish';
  } else if (isFresh) {
    signalSummary = `Fresh ${category} launch with attention building.`;
    reasonLine = 'Still early enough for watchlists and conviction.';
    actionBias = price >= 0 ? 'bullish' : 'neutral';
  } else if (isTaxToken) {
    signalSummary = 'Early stage setup with heavier mechanics. Read carefully before chasing.';
    reasonLine = 'Tax structure can change the risk profile fast.';
    actionBias = 'neutral';
  } else if (volume > 0 && holders > 0) {
    signalSummary = 'Volume and holder activity suggest the token is worth a closer read.';
    reasonLine = 'Sloan is watching if attention converts into stronger conviction.';
  }

  if (questCount > 0 && !signalSummary.toLowerCase().includes('quest')) {
    signalSummary = `${signalSummary.replace(/\.$/, '')} Quest activity is already live.`;
  }

  return {
    category,
    launchAge: token.launchAge || timeAgo(token.lastSyncedAt),
    isPancake,
    isAICreated,
    isXMode,
    isAntiSniper,
    isTaxToken,
    taxRate,
    signalSummary,
    reasonLine,
    actionBias,
    freshnessScore: Math.max(0, Math.min(100, (isFresh ? 45 : 0) + (rank.includes('HOT') ? 25 : 0) + (price > 0 ? Math.min(20, price / 2) : 0))),
  };
}

function byDescending<T>(items: T[], selector: (item: T) => number) {
  return [...items].sort((a, b) => selector(b) - selector(a));
}

function LoadingRail() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <LoadingSkeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <LoadingSkeleton className="h-5 w-40" />
          <LoadingSkeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-[320px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function CommandCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: tokens, loading: tokensLoading, refetch: refetchTokens } = useApi(tokenApi.getAll);
  const { data: quests, loading: questsLoading } = useApi(questApi.getAll);
  const { data: latestSync, refetch: refetchLatestSync } = useApi(tokenApi.getLatestSync);
  const { data: rankBuckets, loading: rankBucketsLoading, refetch: refetchRankBuckets } = useApi(tokenApi.getRankBuckets);

  const loading = tokensLoading || questsLoading || rankBucketsLoading;

  const questCounts = useMemo(() => {
    const map = new Map<string, number>();
    (quests || []).forEach((quest: Quest) => {
      if (!quest.tokenSlug) return;
      map.set(quest.tokenSlug, (map.get(quest.tokenSlug) || 0) + 1);
    });
    return map;
  }, [quests]);

  const enhancedTokens = useMemo(() => {
    return (tokens || []).map((token) => {
      const questCount = questCounts.get(token.slug) || 0;
      return {
        ...token,
        ...deriveSignal(token, questCount),
        hasQuest: questCount > 0,
        questCount,
      } as Token;
    });
  }, [tokens, questCounts]);

  const filteredTokens = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return enhancedTokens.filter((token) => {
      const haystack = `${token.name} ${token.ticker} ${token.category || ''} ${token.signalSummary || ''}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      if (!matchesQuery) return false;

      switch (activeFilter) {
        case 'ai':
          return Boolean(token.isAICreated || token.category === 'AI');
        case 'meme':
          return (token.category || '').toLowerCase() === 'meme';
        case 'liquid':
          return Boolean(token.isPancake || token.listedPancake || (token.volume24h || 0) >= 1_000_000);
        case 'quest':
          return Boolean(token.hasQuest);
        default:
          return true;
      }
    });
  }, [activeFilter, enhancedTokens, searchQuery]);

  const tokenMap = useMemo(() => new Map(filteredTokens.map((token) => [token.slug, token])), [filteredTokens]);

  const hotNow = useMemo(() => {
    const ranked = (rankBuckets?.hot || []).map((token) => tokenMap.get(token.slug)).filter(Boolean) as Token[];
    const fallback = filteredTokens.filter((token) => (token.priceChange24h || 0) > 0);
    return byDescending(ranked.length > 0 ? ranked : fallback, (token) => (token.priceChange24h || 0) + Math.min((token.volume24h || 0) / 100000, 50)).slice(0, 6);
  }, [filteredTokens, rankBuckets, tokenMap]);

  const stillEarly = useMemo(() => {
    const ranked = (rankBuckets?.newest || []).map((token) => tokenMap.get(token.slug)).filter(Boolean) as Token[];
    const fallback = filteredTokens.filter((token) => !token.isPancake && (token.freshnessScore || 0) >= 20);
    return byDescending(ranked.length > 0 ? ranked : fallback, (token) => (token.freshnessScore || 0) + Math.max(token.priceChange24h || 0, 0)).slice(0, 6);
  }, [filteredTokens, rankBuckets, tokenMap]);

  const liquidLeaders = useMemo(() => {
    const ranked = (rankBuckets?.volume || []).map((token) => tokenMap.get(token.slug)).filter(Boolean) as Token[];
    const fallback = filteredTokens;
    return byDescending(ranked.length > 0 ? ranked : fallback, (token) => (token.volume24h || 0) + (token.marketCap || 0) * 0.01).slice(0, 6);
  }, [filteredTokens, rankBuckets, tokenMap]);

  const graduatedTokens = useMemo(() => {
    const ranked = (rankBuckets?.graduated || []).map((token) => tokenMap.get(token.slug)).filter(Boolean) as Token[];
    const fallback = filteredTokens.filter((token) => token.isPancake || token.listedPancake);
    return byDescending(ranked.length > 0 ? ranked : fallback, (token) => (token.volume24h || 0) + (token.marketCap || 0)).slice(0, 6);
  }, [filteredTokens, rankBuckets, tokenMap]);

  const raidReady = useMemo(() => {
    return byDescending(
      filteredTokens.filter((token) => Boolean(token.hasQuest) || (token.actionBias === 'bullish' && (token.volume24h || 0) > 100000)),
      (token) => (token.volume24h || 0) + Math.max(token.priceChange24h || 0, 0) * 10000,
    ).slice(0, 6);
  }, [filteredTokens]);

  const highRiskTokens = useMemo(() => {
    return byDescending(
      filteredTokens.filter((token) => Boolean(token.isTaxToken || token.taxRate || (token.priceChange24h || 0) < -12)),
      (token) => (token.taxRate || 0) * 100 + Math.abs(Math.min(token.priceChange24h || 0, 0)),
    ).slice(0, 6);
  }, [filteredTokens]);

  const totalTokens = enhancedTokens.length;
  const freshLaunches = enhancedTokens.filter((t) => {
    const age = t.launchAge || '';
    return age.includes('min') || age.includes('hour') || (age.includes('day') && parseInt(age, 10) < 2);
  }).length;
  const graduated = enhancedTokens.filter((t) => t.isPancake || t.listedPancake).length;
  const highRisk = enhancedTokens.filter((t) => t.isTaxToken || t.taxRate || (t.priceChange24h || 0) < -12).length;
  const questLive = enhancedTokens.filter((t) => t.hasQuest).length;

  const lastSyncTime = useMemo(() => {
    const timestamp = latestSync?.completedAt || latestSync?.createdAt || latestSync?.updatedAt || latestSync?.startedAt;
    if (!timestamp) return new Date().toLocaleTimeString();
    return new Date(timestamp).toLocaleTimeString();
  }, [latestSync]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await tokenApi.syncFromFourMeme();
      await Promise.all([refetchTokens(), refetchLatestSync(), refetchRankBuckets()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border-subtle bg-background-elevated/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl text-foreground mb-1">Command Center</h1>
              <p className="text-sm text-muted-foreground">Live memecoin radar • Market signals</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/20 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Last sync: {lastSyncTime}
              </div>
              <button
                onClick={handleRefresh}
                className={`p-2 rounded-lg border border-border hover:border-primary/40 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                aria-label="Refresh Four.meme"
              >
                <RefreshCw className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 max-w-md relative min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none text-sm"
              />
            </div>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-primary/40 transition-all text-sm">
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none text-sm"
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="border-b border-border-subtle bg-card/30 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="px-4 py-3 rounded-lg bg-background-subtle border border-border">
              <p className="text-xs text-muted-foreground mb-1">Tracked Tokens</p>
              <p className="text-2xl font-mono text-foreground">{totalTokens}</p>
            </div>
            <div className="px-4 py-3 rounded-lg bg-success/5 border border-success/20">
              <p className="text-xs text-muted-foreground mb-1">Fresh Launches</p>
              <p className="text-2xl font-mono text-success">{freshLaunches}</p>
            </div>
            <div className="px-4 py-3 rounded-lg bg-secondary/5 border border-secondary/20">
              <p className="text-xs text-muted-foreground mb-1">Graduated</p>
              <p className="text-2xl font-mono text-secondary">{graduated}</p>
            </div>
            <div className="px-4 py-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-muted-foreground mb-1">High Risk</p>
              <p className="text-2xl font-mono text-destructive">{highRisk}</p>
            </div>
            <div className="px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Quest Live</p>
              <p className="text-2xl font-mono text-primary">{questLive}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {loading ? (
          <>
            <LoadingRail />
            <LoadingRail />
          </>
        ) : (
          <>
            <TokenRail
              title="Hot Now"
              subtitle="Strongest active heat and movement"
              icon={<TrendingUp className="w-5 h-5 text-warning" />}
              tokens={hotNow}
              variant="hot"
              emptyMessage="No hot tokens at the moment"
            />

            <TokenRail
              title="Still Early"
              subtitle="Fresh launches with attention building"
              icon={<Rocket className="w-5 h-5 text-success" />}
              tokens={stillEarly}
              variant="early"
              emptyMessage="No early tokens found"
            />

            <TokenRail
              title="Liquid Leaders"
              subtitle="High volume and strong liquidity"
              icon={<Droplet className="w-5 h-5 text-primary" />}
              tokens={liquidLeaders}
              variant="liquid"
              emptyMessage="No liquid tokens yet"
            />

            <TokenRail
              title="Graduated to Pancake"
              subtitle="Moved into Pancake trading stage"
              icon={<GraduationCap className="w-5 h-5 text-secondary" />}
              tokens={graduatedTokens}
              variant="graduated"
              emptyMessage="No graduated tokens"
            />

            <TokenRail
              title="Raid Ready"
              subtitle="Strong narrative fit for content push"
              icon={<Megaphone className="w-5 h-5 text-chart-1" />}
              tokens={raidReady}
              variant="default"
              emptyMessage="No raid-ready tokens"
              actionLink="/dashboard/raid-studio"
              actionLabel="Launch Raid"
            />

            <TokenRail
              title="High Risk Mechanics"
              subtitle="Tax or mechanic-heavy tokens requiring caution"
              icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
              tokens={highRiskTokens}
              variant="risk"
              emptyMessage="No high-risk tokens detected"
            />
          </>
        )}
      </div>
    </div>
  );
}

interface TokenRailProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  tokens: Token[];
  variant: 'hot' | 'early' | 'liquid' | 'graduated' | 'risk' | 'default';
  emptyMessage: string;
  actionLink?: string;
  actionLabel?: string;
}

function TokenRail({ title, subtitle, icon, tokens, variant, emptyMessage, actionLink, actionLabel }: TokenRailProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-card border border-card-border flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h2 className="text-xl text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {actionLink && actionLabel && (
          <Link to={actionLink} className="text-sm text-primary hover:underline">
            {actionLabel}
          </Link>
        )}
      </div>

      {tokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <EnhancedTokenCard key={token.id} token={token} variant={variant} />
          ))}
        </div>
      ) : (
        <EmptyState icon={icon} title={emptyMessage} description="Check back soon for updates" />
      )}
    </div>
  );
}
