import { useMemo, useState } from 'react';
import { Activity, RefreshCcw, TrendingUp, Users, Zap } from 'lucide-react';
import { Link } from 'react-router';
import { TokenCard } from '../components/TokenCard';
import { QuestCard } from '../components/QuestCard';
import { PredictionCard } from '../components/PredictionCard';
import { ProphetRow } from '../components/ProphetRow';
import { StatCard } from '../components/StatCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { predictionApi, prophetApi, questApi, tokenApi } from '../services/api';

export function Home() {
  const { data: tokens, loading: tokensLoading, refetch: refetchTokens } = useApi(tokenApi.getAll);
  const { data: quests, loading: questsLoading } = useApi(questApi.getAll);
  const { data: prophets, loading: prophetsLoading } = useApi(prophetApi.getLeaderboard);
  const { data: predictions, loading: predictionsLoading } = useApi(predictionApi.getAll);
  const { data: latestSync, refetch: refetchLatestSync } = useApi(tokenApi.getLatestSync);
  const { data: rankBuckets, loading: rankBucketsLoading, refetch: refetchRankBuckets } = useApi(tokenApi.getRankBuckets);
  const { data: livePulse, loading: livePulseLoading, refetch: refetchLivePulse } = useApi(tokenApi.getLivePulse);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [syncingTokens, setSyncingTokens] = useState(false);
  const [syncError, setSyncError] = useState<string>('');

  const loading = tokensLoading || questsLoading || prophetsLoading || predictionsLoading || rankBucketsLoading || livePulseLoading;
  const firstToken = tokens?.[0];

  const syncLabel = useMemo(() => {
    if (!latestSync?.createdAt) return 'No live sync recorded yet';
    return `Last live sync ${new Date(latestSync.createdAt).toLocaleString()}`;
  }, [latestSync]);

  async function handleSync() {
    setSyncingTokens(true);
    setSyncError('');

    try {
      const result = await tokenApi.syncFromFourMeme();
      setSyncMessage(result.message || `Synced ${result.syncedCount} tokens from Four.meme.`);
      await Promise.all([refetchTokens(), refetchLatestSync(), refetchRankBuckets(), refetchLivePulse()]);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Live sync failed.');
    } finally {
      setSyncingTokens(false);
    }
  }

  if (loading) {
    return <LoadingState message="Booting Sloan command center..." />;
  }

  const hotTokens = rankBuckets?.hot || [];
  const newestTokens = rankBuckets?.newest || [];
  const volumeTokens = rankBuckets?.volume || [];
  const graduatedTokens = rankBuckets?.graduated || [];
  const activeQuests = (quests || []).filter(q => !q.completed).slice(0, 3);
  const topProphets = (prophets || []).slice(0, 5);
  const recentPredictions = (predictions || []).slice(0, 4);
  const totalVolume24h = (tokens || []).reduce((sum, token) => sum + (Number.isFinite(token.volume24h) ? token.volume24h : 0), 0);
  const liveRankLabels = new Set((tokens || []).map((token) => (token.sourceRankLabel || '').toUpperCase()).filter(Boolean));
  const syncStatusLabel = latestSync?.status ? latestSync.status.toUpperCase() : 'WAITING';

  if (!tokens?.length) {
    return (
      <div className="p-8 space-y-6">
        <div className="p-6 rounded-lg bg-card border border-card-border">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">Live source</p>
              <h2 className="text-2xl text-foreground mt-2">Connect Sloan to live Four.meme tokens</h2>
              <p className="text-sm text-foreground-muted mt-2 max-w-2xl">
                Run a live sync to replace the starter rows with current Four.meme launches, rankings, and token detail snapshots.
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncingTokens}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${syncingTokens ? 'animate-spin' : ''}`} />
              {syncingTokens ? 'Syncing live tokens...' : 'Sync Four.meme now'}
            </button>
          </div>
          {(syncMessage || syncError) && (
            <p className="text-sm mt-4 text-foreground-muted">{syncError || syncMessage}</p>
          )}
        </div>
        <EmptyState
          icon={<Zap className="w-8 h-8" />}
          title="No command center data yet"
          description="Once the live sync finishes, Sloan will fill this page with current Four.meme tokens, conviction, quests, and prophet data."
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background-elevated via-background-subtle to-background-elevated border border-card-border p-8">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
            <Zap className="w-4 h-4" />
            <span>AI Operating System</span>
          </div>
          <h1 className="text-4xl md:text-5xl mb-4 max-w-3xl">
            Command Center for live Four.meme intelligence
          </h1>
          <p className="text-lg text-foreground-muted max-w-2xl mb-6">
            Sloan now syncs live Four.meme launches into Supabase, then layers conviction, quests, predictions, and content generation on top.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={firstToken ? `/dashboard/token/${firstToken.slug}` : '/dashboard'} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              Explore Live Tokens
            </Link>
            <button
              onClick={handleSync}
              disabled={syncingTokens}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card hover:border-primary/40 disabled:opacity-60 transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${syncingTokens ? 'animate-spin' : ''}`} />
              {syncingTokens ? 'Refreshing...' : 'Refresh Four.meme feed'}
            </button>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-sm text-foreground-muted">{syncLabel}</p>
            {(syncMessage || syncError) && <p className="text-sm text-foreground-muted">{syncError || syncMessage}</p>}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Activity className="w-4 h-4" />} label="Tracked Tokens" value={tokens.length} subtitle="Live from Four.meme" trend="up" />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="24h Volume" value={totalVolume24h > 0 ? `$${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(totalVolume24h)}` : '—'} subtitle={totalVolume24h > 0 ? 'Across current synced tokens' : 'Not yet available from current sync'} trend={totalVolume24h > 0 ? 'up' : undefined} />
        <StatCard icon={<Users className="w-4 h-4" />} label="Rank Buckets" value={liveRankLabels.size} subtitle="Hot, new, volume, dex labels" />
        <StatCard icon={<Zap className="w-4 h-4" />} label="Latest Sync" value={syncStatusLabel} subtitle={latestSync?.syncedCount ? `${latestSync.syncedCount} tokens indexed` : 'Waiting for a fresh sync'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl text-foreground">Hot on Four.meme</h2>
                <p className="text-sm text-foreground-muted">Live ranking rail after the latest sync.</p>
              </div>
              <Link to={firstToken ? `/dashboard/token/${firstToken.slug}` : '/dashboard'} className="text-sm text-primary hover:underline">
                Open live feed
              </Link>
            </div>
            <div className="grid gap-4">
              {(hotTokens.length > 0 ? hotTokens : tokens.slice(0, 3)).slice(0, 3).map(token => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl text-foreground">Fresh launches</h2>
                <span className="text-xs uppercase tracking-[0.22em] text-primary">NEW</span>
              </div>
              <div className="grid gap-4">
                {newestTokens.slice(0, 2).map(token => <TokenCard key={token.id} token={token} />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl text-foreground">Volume leaders</h2>
                <span className="text-xs uppercase tracking-[0.22em] text-primary">VOL</span>
              </div>
              <div className="grid gap-4">
                {volumeTokens.slice(0, 2).map(token => <TokenCard key={token.id} token={token} />)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl text-foreground">Live pulse</h2>
              <span className="text-sm text-foreground-muted">Built from live Four.meme sync data</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(livePulse || []).slice(0, 4).map(event => (
                <div key={event.id} className="p-4 rounded-lg bg-card border border-card-border">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-foreground">{event.title}</p>
                    <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-[0.18em] ${event.tone === 'hot' ? 'bg-success/10 text-success' : event.tone === 'fresh' ? 'bg-primary/10 text-primary' : event.tone === 'liquid' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                      {event.tone}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-2">{event.subtitle}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[11px] text-foreground-muted">{event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Live sync'}</p>
                    {event.tokenSlug && <Link to={`/dashboard/token/${event.tokenSlug}`} className="text-xs text-primary hover:underline">Open token</Link>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl text-foreground">Prophet Leaderboard</h2>
              <Link to="/dashboard/prophets" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {topProphets.length > 0 ? topProphets.map(prophet => (
                <ProphetRow key={prophet.username} prophet={prophet} variant="compact" />
              )) : (
                <div className="p-4 rounded-lg bg-card border border-card-border text-sm text-foreground-muted">
                  No live prophet leaderboard data yet. Sloan will show real forecasters after users start making predictions.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl text-foreground">Graduated and liquid</h2>
              <span className="text-xs uppercase tracking-[0.22em] text-primary">DEX</span>
            </div>
            <div className="grid gap-4">
              {graduatedTokens.length > 0 ? graduatedTokens.slice(0, 3).map(token => <TokenCard key={token.id} token={token} />) : (
                <div className="p-4 rounded-lg bg-card border border-card-border text-sm text-foreground-muted">
                  No live DEX or graduated tokens have been indexed yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-foreground">Active Quests</h2>
          <Link to="/dashboard/quests" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeQuests.length > 0 ? activeQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          )) : (
            <div className="md:col-span-2 lg:col-span-3 p-4 rounded-lg bg-card border border-card-border text-sm text-foreground-muted">
              No live quests yet. Add quests from the backend when you are ready to activate the community layer.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-foreground">Recent Predictions</h2>
          <Link to="/dashboard/prophets" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentPredictions.length > 0 ? recentPredictions.map(prediction => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          )) : (
            <div className="md:col-span-2 p-4 rounded-lg bg-card border border-card-border text-sm text-foreground-muted">
              No live predictions yet. Prophet League will populate after real users start submitting calls.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
