import { RotateCcw, AlertTriangle, TrendingUp, Brain, ShieldCheck, Radar, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { Link } from 'react-router';
import { useMemo } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { StatCard } from '../components/StatCard';
import { useApi } from '../hooks/useApi';
import { predictionApi, tokenApi, userApi } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { formatCount, formatPercent, formatUsd } from '../lib/format';
import type { CounterfactualEntry, Prediction, Token } from '../types';

type PatternBucket = 'hesitation' | 'peak_chasing' | 'late_exit' | 'over_caution';

function classifyPattern(entry: CounterfactualEntry): PatternBucket {
  const text = `${entry.missedAction} ${entry.insight}`.toLowerCase();
  if (text.includes('peak') || text.includes('fomo') || text.includes('late entry')) return 'peak_chasing';
  if (text.includes('sold') || text.includes('take profit') || text.includes('held')) return 'late_exit';
  if (text.includes('no on') || text.includes('over-caution') || text.includes('sidelines') || text.includes('waited')) return 'over_caution';
  return 'hesitation';
}

function patternLabel(bucket: PatternBucket) {
  switch (bucket) {
    case 'peak_chasing':
      return 'Peak chasing';
    case 'late_exit':
      return 'Late exits';
    case 'over_caution':
      return 'Over-caution';
    default:
      return 'Hesitation';
  }
}

function patternDescription(bucket: PatternBucket) {
  switch (bucket) {
    case 'peak_chasing':
      return 'You tend to move when the crowd already stretched the setup.';
    case 'late_exit':
      return 'You let timing drift after the trade already proved itself.';
    case 'over_caution':
      return 'You stay too defensive even after live confirmation improves.';
    default:
      return 'You delay action while the setup is already readable.';
  }
}

function getNextMove(entry: CounterfactualEntry, token?: Token) {
  const bucket = classifyPattern(entry);
  if (bucket === 'peak_chasing') {
    return 'Wait for a reset or a cleaner confirmation before taking the next entry.';
  }
  if (bucket === 'late_exit') {
    return 'Define the exit condition before the next move so profit-taking is not emotional.';
  }
  if (bucket === 'over_caution') {
    return 'When volume and holders rise together, treat that as enough confirmation to act sooner.';
  }
  if (token?.momentum === 'rising') {
    return 'When a live token is still rising, make the call while the setup is clear instead of after it is obvious.';
  }
  return 'Use the next similar setup to act earlier with a tighter, pre-defined invalidation.';
}

function getResolutionWindow(predictions: Prediction[], username: string) {
  const windows = new Set(predictions.filter((item) => item.username === username).map((item) => item.timeframe));
  if (windows.has('24h')) return '24h';
  if (windows.has('6h')) return '6h';
  return windows.values().next().value || '24h';
}

export function MirrorFeed() {
  const { profile } = useAuth();
  const username = profile?.username || '';
  const { data: counterfactuals, loading: counterfactualLoading } = useApi(() => userApi.getCounterfactuals(username), [username]);
  const { data: predictions, loading: predictionLoading } = useApi(() => predictionApi.getByUser(username), [username]);
  const { data: tokens, loading: tokenLoading } = useApi(tokenApi.getAll);

  const loading = counterfactualLoading || predictionLoading || tokenLoading;
  const items = counterfactuals || [];
  const liveTokens = tokens || [];
  const myPredictions = predictions || [];
  const tokenMap = useMemo(() => new Map(liveTokens.map((token) => [token.slug, token])), [liveTokens]);
  const totalPotential = items.reduce((sum, item) => sum + item.potentialGain, 0);

  const patternCounts = useMemo(() => {
    return items.reduce<Record<PatternBucket, number>>((acc, item) => {
      const bucket = classifyPattern(item);
      acc[bucket] += 1;
      return acc;
    }, {
      hesitation: 0,
      peak_chasing: 0,
      late_exit: 0,
      over_caution: 0,
    });
  }, [items]);

  const strongestPattern = (Object.entries(patternCounts) as Array<[PatternBucket, number]>).sort((a, b) => b[1] - a[1])[0]?.[0];
  const totalPatterns = Object.values(patternCounts).filter((count) => count > 0).length;
  const recoveryScore = Math.max(48, 100 - patternCounts.peak_chasing * 10 - patternCounts.late_exit * 8 - patternCounts.over_caution * 7 - patternCounts.hesitation * 6 + Math.min(12, myPredictions.length * 2));
  const positiveMisses = items.filter((item) => item.potentialGain > 0).length;
  const negativeMisses = items.filter((item) => item.potentialGain < 0).length;
  const liveRewatch = useMemo(() => {
    return [...liveTokens]
      .filter((token) => token.priceChange24h > 0 || token.volume24h > 0)
      .sort((a, b) => (b.volume24h + Math.max(0, b.priceChange24h) * 1200) - (a.volume24h + Math.max(0, a.priceChange24h) * 1200))
      .slice(0, 3);
  }, [liveTokens]);

  const recoveryPlan = useMemo(() => {
    return [
      strongestPattern ? `Tighten your next entry rule around ${patternLabel(strongestPattern).toLowerCase()} instead of reacting late.` : 'Define your next entry rule before the crowd makes the setup obvious.',
      `Use Sloan's current live feed to pick one token and make a ${getResolutionWindow(myPredictions, username)} call instead of watching passively.`,
      positiveMisses > negativeMisses
        ? 'Your bigger leak is missing upside. Act earlier when volume and holders confirm each other.'
        : 'Your bigger leak is protecting entries too late. Use clearer invalidation before the next move.',
    ];
  }, [strongestPattern, myPredictions, positiveMisses, negativeMisses]);

  if (loading) return <LoadingState message="Loading your live mirror feed..." />;

  return (
    <div className="p-8 space-y-8">
      <SectionHeader
        title="Mirror Feed"
        subtitle="A live review of what you missed, what it says about your behavior, and how to clean up the next decision"
        icon={<RotateCcw className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle className="w-4 h-4 text-primary" />} label="Mirror entries" value={`${items.length}`} subtitle="live behavior flags" />
        <StatCard icon={<TrendingUp className="w-4 h-4 text-primary" />} label="Potential delta" value={`${totalPotential >= 0 ? '+' : '-'}${formatUsd(Math.abs(totalPotential), { compact: true, empty: '$0' })}`} subtitle="estimated missed edge" trend={totalPotential >= 0 ? 'up' : 'down'} />
        <StatCard icon={<ShieldCheck className="w-4 h-4 text-primary" />} label="Recovery score" value={`${recoveryScore}/100`} subtitle={strongestPattern ? `${patternLabel(strongestPattern)} is your main leak` : 'no dominant leak yet'} trend={recoveryScore >= 70 ? 'up' : 'down'} />
        <StatCard icon={<Brain className="w-4 h-4 text-primary" />} label="Patterns detected" value={`${totalPatterns}`} subtitle="repeat behaviors Sloan sees" />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="w-8 h-8" />}
          title="No mirror entries yet"
          description="Once Sloan records counterfactual entries or derives them from your live activity, your missed setups and behavior patterns will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6 items-start">
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-card border border-card-border">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-foreground mb-1">Missed setups</h3>
                  <p className="text-sm text-muted-foreground">These are the live situations Sloan thinks were most informative about your current decision pattern.</p>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs">{positiveMisses} upside misses • {negativeMisses} drawdown warnings</span>
              </div>
              <div className="space-y-4">
                {items.map((entry) => {
                  const token = tokenMap.get(entry.tokenSlug);
                  const bucket = classifyPattern(entry);
                  return (
                    <div key={entry.id} className="p-5 rounded-lg border border-card-border bg-background-subtle space-y-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Link to={`/dashboard/token/${entry.tokenSlug}`} className="text-foreground hover:text-primary transition-colors">{entry.tokenName}</Link>
                            <span className="px-2 py-1 rounded-full text-[11px] bg-warning/10 text-warning">{patternLabel(bucket)}</span>
                            {token ? <span className={`px-2 py-1 rounded-full text-[11px] ${token.momentum === 'rising' ? 'bg-success/10 text-success' : token.momentum === 'falling' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground-muted'}`}>{token.momentum}</span> : null}
                          </div>
                          <p className="text-foreground leading-relaxed">{entry.missedAction}</p>
                          <p className="text-xs text-muted-foreground mt-2">Logged {new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                        <div className={`px-3 py-2 rounded-lg text-sm font-mono ${entry.potentialGain >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {entry.potentialGain >= 0 ? '+' : '-'}{formatUsd(Math.abs(entry.potentialGain), { compact: true, empty: '$0' })}
                        </div>
                      </div>

                      {token ? (
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 text-xs text-muted-foreground">
                          <div>
                            <p>Price</p>
                            <p className="text-foreground font-mono">{formatUsd(token.price, { compact: false })}</p>
                          </div>
                          <div>
                            <p>24h change</p>
                            <p className="text-foreground font-mono">{formatPercent(token.priceChange24h, { showPlus: true })}</p>
                          </div>
                          <div>
                            <p>24h volume</p>
                            <p className="text-foreground font-mono">{formatUsd(token.volume24h)}</p>
                          </div>
                          <div>
                            <p>Holders</p>
                            <p className="text-foreground font-mono">{formatCount(token.holders)}</p>
                          </div>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="p-4 rounded-lg bg-card border border-card-border">
                          <div className="flex items-start gap-2">
                            <Brain className="w-4 h-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">What Sloan sees</p>
                              <p className="text-sm text-foreground">{entry.insight}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-card-border">
                          <div className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Next move</p>
                              <p className="text-sm text-foreground">{getNextMove(entry, token)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg bg-card border border-card-border space-y-4">
                <div>
                  <h3 className="text-foreground mb-1">Personal edge</h3>
                  <p className="text-sm text-muted-foreground">These are the live tokens Sloan thinks you should revisit with cleaner timing instead of watching passively.</p>
                </div>
                <div className="space-y-3">
                  {liveRewatch.map((token) => (
                    <div key={token.slug} className="p-4 rounded-lg bg-background-subtle border border-border flex items-start justify-between gap-4">
                      <div>
                        <Link to={`/dashboard/token/${token.slug}`} className="text-foreground hover:text-primary transition-colors">{token.name}</Link>
                        <p className="text-xs text-muted-foreground mt-1">{token.narrativeSummary || `${token.name} still has live participation, which makes it worth a cleaner second look.`}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-foreground font-mono">{formatUsd(token.volume24h)}</p>
                        <p className={`${token.priceChange24h >= 0 ? 'text-success' : 'text-destructive'} font-mono mt-1`}>{formatPercent(token.priceChange24h, { showPlus: true })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-lg bg-card border border-card-border space-y-4">
                <div>
                  <h3 className="text-foreground mb-1">Recovery plan</h3>
                  <p className="text-sm text-muted-foreground">Use the mirror feed as a pre-trade checklist, not just a regret board.</p>
                </div>
                <div className="space-y-3">
                  {recoveryPlan.map((step, index) => (
                    <div key={index} className="p-4 rounded-lg bg-background-subtle border border-border flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mt-0.5">{index + 1}</div>
                      <p className="text-sm text-foreground leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 xl:sticky xl:top-24">
            <div className="p-6 rounded-lg bg-card border border-card-border">
              <div className="flex items-center gap-2 mb-4">
                <Radar className="w-4 h-4 text-primary" />
                <h3 className="text-foreground">Behavior map</h3>
              </div>
              <div className="space-y-4">
                {(Object.entries(patternCounts) as Array<[PatternBucket, number]>).map(([bucket, count]) => {
                  const share = items.length > 0 ? Math.round((count / items.length) * 100) : 0;
                  return (
                    <div key={bucket} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{patternLabel(bucket)}</span>
                        <span className="text-muted-foreground">{count} cases</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-background-subtle overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${share}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{patternDescription(bucket)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card border border-card-border">
              <h3 className="text-foreground mb-4">Mirror verdict</h3>
              <div className="space-y-3 text-sm">
                <div className="p-4 rounded-lg bg-background-subtle border border-border flex items-start gap-3">
                  <ArrowUpRight className="w-4 h-4 text-success mt-0.5" />
                  <div>
                    <p className="text-foreground">Biggest upside leak</p>
                    <p className="text-muted-foreground mt-1">{positiveMisses > 0 ? 'You are losing more edge by waiting too long than by being completely wrong.' : 'Your opportunity cost is still light. Keep logging real decisions.'}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background-subtle border border-border flex items-start gap-3">
                  <ArrowDownRight className="w-4 h-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-foreground">Main drawdown warning</p>
                    <p className="text-muted-foreground mt-1">{negativeMisses > 0 ? 'When the crowd stretches a setup, you still need a cleaner no-trade or exit rule.' : 'Your current mirror entries are mostly about missed upside, not catastrophic drawdowns.'}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background-subtle border border-border flex items-start gap-3">
                  <Brain className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-foreground">What Sloan wants next</p>
                    <p className="text-muted-foreground mt-1">Make one cleaner Prophet League call and use Mirror Feed to review it after the window closes. That is how the system becomes personal instead of generic.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
