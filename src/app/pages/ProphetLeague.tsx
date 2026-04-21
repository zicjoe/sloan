import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CheckCircle2, RefreshCw, Search, Target, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ActiveCallCard } from '../components/ActiveCallCard';
import { EmptyState } from '../components/EmptyState';
import { FocusedTokenPanel } from '../components/FocusedTokenPanel';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { LoadingSkeleton, LoadingState } from '../components/LoadingState';
import { OpportunityCard } from '../components/OpportunityCard';
import { ResolvedCallCard } from '../components/ResolvedCallCard';
import { useApi, useMutation } from '../hooks/useApi';
import { predictionApi, prophetApi, tokenApi } from '../services/api';
import type { Prediction, PredictionConfidence, PredictionOpportunity, Token } from '../types';

function confidenceLabelToPercent(confidence?: PredictionConfidence) {
  switch (confidence) {
    case 'high':
      return 85;
    case 'medium':
      return 60;
    case 'low':
      return 35;
    default:
      return 50;
  }
}

function formatSyncAge(value?: string) {
  if (!value) return 'just now';
  const ms = Date.now() - new Date(value).getTime();
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getOutcomeLabel(prediction: Prediction) {
  if (prediction.status === 'correct') {
    return prediction.scoreAwarded && prediction.scoreAwarded >= 12 ? 'Good Read' : 'Right Call';
  }
  if (prediction.status === 'incorrect') {
    return prediction.binaryAnswer === 'yes' ? 'Weak Conviction' : 'Missed';
  }
  return 'Expired';
}

export function ProphetLeague() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, isAuthenticated } = useAuth();
  const username = profile?.username || '';
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const tokenFilter = searchParams.get('token') || '';
  const callFilter = searchParams.get('call') || '';

  const { data: tokens, loading: tokensLoading } = useApi(tokenApi.getAll, [refreshKey]);
  const { data: predictions, loading: predictionsLoading, refetch } = useApi(predictionApi.getAll, [refreshKey]);
  const { data: opportunities, loading: opportunitiesLoading } = useApi(predictionApi.getOpportunities, [refreshKey]);
  const { data: leaderboard, loading: leaderboardLoading } = useApi(prophetApi.getLeaderboard, [refreshKey]);
  const { mutate, loading: createLoading } = useMutation(predictionApi.create);

  const loading = tokensLoading || predictionsLoading || opportunitiesLoading || leaderboardLoading;
  const liveTokens = tokens || [];
  const livePredictions = predictions || [];
  const liveOpportunities = opportunities || [];
  const liveLeaderboard = leaderboard || [];

  const filteredOpportunities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return liveOpportunities.filter((opportunity) => {
      const token = liveTokens.find((item) => item.slug === opportunity.tokenSlug);
      if (!token) return false;
      if (!query) return true;
      return [token.name, token.ticker, opportunity.title, opportunity.callType, opportunity.tokenState || '']
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [liveOpportunities, liveTokens, searchQuery]);

  const focusedOpportunity = tokenFilter
    ? liveOpportunities.find((item) => item.id === callFilter) || liveOpportunities.find((item) => item.tokenSlug === tokenFilter)
    : undefined;
  const focusedToken = tokenFilter ? liveTokens.find((token) => token.slug === tokenFilter) : undefined;

  const myPredictions = useMemo(() => livePredictions.filter((prediction) => prediction.username === username), [livePredictions, username]);
  const activeCalls = useMemo(() => myPredictions.filter((prediction) => prediction.status === 'pending'), [myPredictions]);
  const resolvedCalls = useMemo(() => myPredictions.filter((prediction) => prediction.status !== 'pending'), [myPredictions]);

  const correctCalls = resolvedCalls.filter((prediction) => prediction.status === 'correct');
  const points = myPredictions.reduce((sum, prediction) => sum + (prediction.scoreAwarded || 0), 0);
  const currentProfile = liveLeaderboard.find((entry) => entry.username === username) || liveLeaderboard[0];
  const accuracy = resolvedCalls.length > 0 ? Number(((correctCalls.length / resolvedCalls.length) * 100).toFixed(1)) : Number(currentProfile?.accuracy?.toFixed?.(1) || 0);
  const latestSync = useMemo(() => {
    const values = liveTokens.map((token) => token.lastSyncedAt).filter((value): value is string => Boolean(value)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return values[0] || new Date().toISOString();
  }, [liveTokens]);

  async function handleSubmitCall(token: Token, call: { answer: 'yes' | 'no'; expiry: string; reason?: string }, selectedOpportunity?: PredictionOpportunity) {
    const matchedOpportunity = selectedOpportunity || liveOpportunities.find((item) => item.tokenSlug === token.slug) || focusedOpportunity;
    const result = await mutate({
      tokenSlug: token.slug,
      prediction: call.answer === 'yes' ? 'moon' : 'dump',
      timeframe: call.expiry,
      reasoning: call.reason || matchedOpportunity?.reasoningHint || token.reasonLine || token.signalSummary || `${token.name} conviction call from Prophet League.`,
      callType: matchedOpportunity?.callType || 'momentum',
      confidence: matchedOpportunity?.confidence || 'medium',
      compareTokenSlug: matchedOpportunity?.compareTokenSlug,
      question: matchedOpportunity?.question || `Will ${token.name} hold up over the next ${call.expiry}?`,
      binaryAnswer: call.answer,
    } as Partial<Prediction> & { tokenSlug: string; prediction: Prediction['prediction']; reasoning: string; timeframe: string });

    if (result) {
      setRefreshKey((value) => value + 1);
      refetch();
    }
  }

  function handleRefresh() {
    setRefreshKey((value) => value + 1);
  }

  function handleMakeCall(tokenSlug: string, opportunityId: string) {
    setSearchParams({ token: tokenSlug, call: opportunityId });
  }

  if (loading && liveTokens.length === 0) return <LoadingState message="Loading prophet league..." />;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="mb-4 flex items-start justify-between gap-6">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Prophet League</h1>
              <p className="text-muted-foreground">AI studies the token first, then Sloan surfaces the call type that actually fits the setup.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span className="text-muted-foreground">Live • Updated {formatSyncAge(latestSync)}</span>
              </div>
              <button type="button" onClick={handleRefresh} disabled={loading} className="rounded-lg border border-border bg-card p-2 transition-all hover:border-primary/40 disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 text-foreground ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search tokens or call types..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full rounded-lg border border-border bg-input-background py-2 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr,340px]">
          <div className="space-y-8">
            {focusedToken ? (
              <FocusedTokenPanel token={{ ...focusedToken, image: focusedToken.image || '' }} opportunity={focusedOpportunity} onSubmitCall={(call) => handleSubmitCall(focusedToken, call, focusedOpportunity)} />
            ) : null}

            <section>
              <div className="mb-6 flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">Live Opportunities</h2>
                  <p className="text-sm text-muted-foreground">AI-selected calls based on each token's current condition</p>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((index) => <LoadingSkeleton key={index} className="h-[390px]" />)}
                </div>
              ) : filteredOpportunities.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredOpportunities.map((opportunity) => {
                    const token = liveTokens.find((item) => item.slug === opportunity.tokenSlug);
                    if (!token) return null;
                    return <OpportunityCard key={opportunity.id} token={{ ...token, image: token.image || '' }} opportunity={opportunity} onMakeCall={handleMakeCall} />;
                  })}
                </div>
              ) : (
                <EmptyState icon={<Zap className="h-6 w-6" />} title="No opportunities match your search" description="Try a different token or wait for the next sync." />
              )}
            </section>

            <section>
              <div className="mb-6 flex items-center gap-3">
                <Target className="h-6 w-6 text-warning" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">Active Calls</h2>
                  <p className="text-sm text-muted-foreground">Your pending predictions in flight</p>
                </div>
              </div>

              {activeCalls.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeCalls.map((prediction) => {
                    const token = liveTokens.find((item) => item.slug === prediction.tokenSlug);
                    return (
                      <ActiveCallCard key={prediction.id} call={{ id: prediction.id, token: { name: prediction.tokenName, ticker: token?.ticker || prediction.tokenName.slice(0, 4).toUpperCase(), image: token?.image || '', currentPrice: token?.price }, question: prediction.question || `Will ${prediction.tokenName} hold up over ${prediction.timeframe}?`, answer: prediction.binaryAnswer || (prediction.prediction === 'moon' ? 'yes' : 'no'), confidence: confidenceLabelToPercent(prediction.confidence), expiry: prediction.timeframe, createdAt: prediction.timestamp, baselinePrice: prediction.baselinePrice, baselineVolume: prediction.baselineVolume24h, baselineHolders: prediction.baselineHolders }} />
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<Target className="h-6 w-6" />} title={isAuthenticated ? 'No active calls' : 'Sign in to track calls'} description={isAuthenticated ? 'Make your first AI-prepared call on a live setup to track it here.' : 'Your predictions and scoring history appear here once you are signed in.'} />
              )}
            </section>

            <section>
              <div className="mb-6 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">Resolved Calls</h2>
                  <p className="text-sm text-muted-foreground">Learn from the setups you backed</p>
                </div>
              </div>

              {resolvedCalls.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {resolvedCalls.map((prediction) => {
                    const token = liveTokens.find((item) => item.slug === prediction.tokenSlug);
                    return (
                      <ResolvedCallCard key={prediction.id} call={{ id: prediction.id, token: { name: prediction.tokenName, ticker: token?.ticker || prediction.tokenName.slice(0, 4).toUpperCase(), image: token?.image || '' }, question: prediction.question || `How did ${prediction.tokenName} behave over ${prediction.timeframe}?`, answer: prediction.binaryAnswer || (prediction.prediction === 'moon' ? 'yes' : 'no'), confidence: confidenceLabelToPercent(prediction.confidence), result: prediction.status === 'correct' ? 'correct' : prediction.status === 'incorrect' ? 'incorrect' : 'expired', scoreAwarded: prediction.scoreAwarded || 0, resolutionNote: prediction.resolutionNote || 'Sloan resolved this call from live token movement and the baseline snapshot.', createdAt: prediction.timestamp, resolvedAt: prediction.expiresAt || prediction.timestamp, outcomeLabel: getOutcomeLabel(prediction) }} />
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="No resolved calls yet" description="Completed predictions will appear here with outcomes and scores." />
              )}
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <LeaderboardPanel userStats={{ rank: currentProfile?.rank, accuracy, totalCalls: myPredictions.length, resolvedCalls: resolvedCalls.length, points }} topProphets={liveLeaderboard.slice(0, 5).map((entry) => ({ rank: entry.rank, username: entry.username, avatar: (entry as any).avatar, accuracy: Number(entry.accuracy.toFixed(1)), points: entry.correctPredictions * 10, totalCalls: entry.totalPredictions }))} />

            <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
              <h3 className="mb-3 font-semibold text-foreground">How Sloan frames calls</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Sloan reads the token state first, then chooses the call type that best fits that condition.</span></li>
                <li className="flex items-start gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Calls are resolved from price, volume, liquidity, and event state, not social noise or easy-to-bot metrics.</span></li>
                <li className="flex items-start gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Best reads come from token context and structure, not from crowd excitement alone.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
