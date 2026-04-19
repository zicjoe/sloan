import { Trophy, TrendingUp, Target, Award, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { SectionHeader } from '../components/SectionHeader';
import { ProphetRow } from '../components/ProphetRow';
import { PredictionCard } from '../components/PredictionCard';
import { StatCard } from '../components/StatCard';
import { LoadingState } from '../components/LoadingState';
import { useApi, useMutation } from '../hooks/useApi';
import { predictionApi, prophetApi, tokenApi } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { formatPercent, formatUsd } from '../lib/format';
import type { Prediction, PredictionOpportunity } from '../types';

export function ProphetLeague() {
  const { profile, isAuthenticated } = useAuth();
  const username = profile?.username || 'current_user';
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedFeed, setSelectedFeed] = useState<'open' | 'resolved'>('open');

  const { data: prophets, loading: prophetsLoading } = useApi(prophetApi.getLeaderboard, [refreshKey]);
  const { data: predictions, loading: predictionsLoading, refetch } = useApi(predictionApi.getAll, [refreshKey]);
  const { data: opportunities, loading: opportunitiesLoading } = useApi(predictionApi.getOpportunities, [refreshKey]);
  const { data: tokens } = useApi(tokenApi.getAll, [refreshKey]);
  const { mutate, loading: createLoading } = useMutation(predictionApi.create);

  const loading = prophetsLoading || predictionsLoading || opportunitiesLoading;
  const liveTokens = tokens || [];

  const myPredictions = useMemo(
    () => (predictions || []).filter((prediction) => prediction.username === username),
    [predictions],
  );

  const openPredictions = useMemo(
    () => (predictions || []).filter((prediction) => prediction.status === 'pending'),
    [predictions],
  );

  const resolvedPredictions = useMemo(
    () => (predictions || []).filter((prediction) => prediction.status !== 'pending'),
    [predictions],
  );

  const recentFeed = selectedFeed === 'open' ? openPredictions : resolvedPredictions;
  const currentProfile = (prophets || []).find((prophet) => prophet.username === username) || prophets?.[0];
  const resolvedMine = myPredictions.filter((prediction) => prediction.status !== 'pending');
  const correctMine = resolvedMine.filter((prediction) => prediction.status === 'correct');
  const myScore = myPredictions.reduce((sum, prediction) => sum + (prediction.scoreAwarded || 0), 0);
  const liveAccuracy = resolvedMine.length > 0 ? `${((correctMine.length / resolvedMine.length) * 100).toFixed(1)}%` : currentProfile ? `${currentProfile.accuracy.toFixed(1)}%` : '0%';

  async function answerOpportunity(opportunity: PredictionOpportunity, answer: 'yes' | 'no') {
    if (!isAuthenticated) return;
    const token = liveTokens.find((item) => item.slug === opportunity.tokenSlug);
    const result = await mutate({
      tokenSlug: opportunity.tokenSlug,
      prediction: answer === 'yes' ? 'moon' : 'dump',
      timeframe: opportunity.timeframe,
      reasoning: opportunity.reasoningHint,
      callType: opportunity.callType,
      confidence: opportunity.confidence,
      question: opportunity.question,
      binaryAnswer: answer,
    } as any);

    if (result) {
      setRefreshKey((value) => value + 1);
      refetch();
      setSelectedFeed('open');
    }
  }

  function answeredForOpportunity(opportunity: PredictionOpportunity) {
    return myPredictions.find(
      (prediction) => prediction.tokenSlug === opportunity.tokenSlug && prediction.question === opportunity.question,
    );
  }

  if (loading) {
    return <LoadingState message="Loading prophet league..." />;
  }

  return (
    <div className="p-8 space-y-8">
      <SectionHeader
        title="Prophet League"
        subtitle="Tap yes or no on live token questions and let Sloan score the call later"
        icon={<Trophy className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Target className="w-4 h-4 text-primary" />} label="Open calls" value={`${openPredictions.length}`} subtitle="awaiting resolution" />
        <StatCard icon={<TrendingUp className="w-4 h-4 text-primary" />} label="Your hit rate" value={liveAccuracy} subtitle="resolved yes/no calls" />
        <StatCard icon={<Award className="w-4 h-4 text-primary" />} label="Your score" value={`${myScore >= 0 ? '+' : ''}${myScore}`} subtitle="prophet points" trend={myScore >= 0 ? 'up' : 'down'} />
        <StatCard icon={<Trophy className="w-4 h-4 text-primary" />} label="Your rank" value={currentProfile ? `#${currentProfile.rank}` : '—'} subtitle="live board" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-6 items-start">
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-foreground mb-1">Live prediction cards</h3>
                <p className="text-sm text-muted-foreground">Sloan inspects live tokens, picks the cleanest question, and lets people answer with one tap.</p>
              </div>
              <span className="text-xs text-muted-foreground">{(opportunities || []).length} live cards</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {(opportunities || []).map((opportunity) => {
                const token = liveTokens.find((item) => item.slug === opportunity.tokenSlug);
                const existing = answeredForOpportunity(opportunity);
                return (
                  <div key={opportunity.id} className="p-5 rounded-lg bg-background-subtle border border-border space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-foreground">{opportunity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{opportunity.timeframe} • {opportunity.confidence} confidence</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">AI picked</span>
                    </div>

                    {token ? (
                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div>
                          <p>Price</p>
                          <p className="text-foreground font-mono">{formatUsd(token.price, { compact: false })}</p>
                        </div>
                        <div>
                          <p>24h volume</p>
                          <p className="text-foreground font-mono">{formatUsd(token.volume24h)}</p>
                        </div>
                        <div>
                          <p>Holders</p>
                          <p className="text-foreground font-mono">{token.holders || 0}</p>
                        </div>
                        <div>
                          <p>24h change</p>
                          <p className="text-foreground font-mono">{formatPercent(token.priceChange24h, { showPlus: true })}</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="p-4 rounded-lg bg-card border border-card-border">
                      <p className="text-sm text-foreground leading-relaxed">{opportunity.question}</p>
                      <p className="text-xs text-muted-foreground mt-2">{opportunity.reasoningHint}</p>
                    </div>

                    {existing ? (
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-foreground">You answered {existing.binaryAnswer === 'yes' ? 'Yes' : 'No'}</p>
                            <p className="text-xs text-muted-foreground mt-1">Status: {existing.status}</p>
                          </div>
                          {existing.status === 'correct' ? <CheckCircle2 className="w-4 h-4 text-success" /> : existing.status === 'incorrect' ? <XCircle className="w-4 h-4 text-destructive" /> : <Clock3 className="w-4 h-4 text-warning" />}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          disabled={createLoading}
                          onClick={() => answerOpportunity(opportunity, 'yes')}
                          className="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70"
                        >
                          {opportunity.yesLabel || 'Yes'}
                        </button>
                        <button
                          type="button"
                          disabled={createLoading}
                          onClick={() => answerOpportunity(opportunity, 'no')}
                          className="px-4 py-3 rounded-lg border border-border bg-card text-foreground hover:border-primary/40 transition-all disabled:opacity-70"
                        >
                          {opportunity.noLabel || 'No'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-foreground mb-1">Prediction board</h3>
                <p className="text-sm text-muted-foreground">Open and resolved yes or no calls scored against live token changes.</p>
              </div>
              <div className="inline-flex rounded-lg border border-border overflow-hidden">
                <button type="button" onClick={() => setSelectedFeed('open')} className={`px-3 py-2 text-sm ${selectedFeed === 'open' ? 'bg-primary text-primary-foreground' : 'bg-background-subtle text-foreground-muted'}`}>Open</button>
                <button type="button" onClick={() => setSelectedFeed('resolved')} className={`px-3 py-2 text-sm ${selectedFeed === 'resolved' ? 'bg-primary text-primary-foreground' : 'bg-background-subtle text-foreground-muted'}`}>Resolved</button>
              </div>
            </div>
            <div className="space-y-4">
              {recentFeed.length > 0 ? recentFeed.map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              )) : (
                <div className="p-4 rounded-lg bg-background-subtle text-sm text-foreground-muted">
                  No {selectedFeed} calls yet. Tap yes or no on a live card above to activate this board.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="mb-4">
              <h3 className="text-foreground mb-1">How Prophet League works</h3>
              <p className="text-sm text-muted-foreground">Keep the action simple. Sloan chooses the question. Users only answer yes or no.</p>
            </div>
            <div className="space-y-3 text-sm text-foreground-muted">
              <div className="p-3 rounded-lg bg-background-subtle border border-border"><span className="text-foreground">1.</span> Sloan reads live token state and picks the cleanest prediction question.</div>
              <div className="p-3 rounded-lg bg-background-subtle border border-border"><span className="text-foreground">2.</span> Users tap <span className="text-foreground">Yes</span> or <span className="text-foreground">No</span> instead of filling long forms.</div>
              <div className="p-3 rounded-lg bg-background-subtle border border-border"><span className="text-foreground">3.</span> After the window closes, Sloan resolves the call against live token data.</div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Top prophets</h3>
            <div className="space-y-3">
              {(prophets || []).length > 0 ? (prophets || []).map((prophet, index) => (
                <ProphetRow key={prophet.username} prophet={prophet} rank={index} variant="detailed" />
              )) : (
                <div className="p-4 rounded-lg bg-background-subtle text-sm text-foreground-muted">
                  No prophet board yet. Sloan will rank people as soon as calls are made and resolved.
                </div>
              )}
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Your recent calls</h3>
            <div className="space-y-3">
              {myPredictions.slice(0, 4).map((prediction) => (
                <div key={prediction.id} className="p-3 rounded-lg bg-background-subtle border border-border">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm text-foreground">{prediction.tokenName}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${prediction.status === 'correct' ? 'bg-success/10 text-success' : prediction.status === 'incorrect' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>{prediction.status}</span>
                  </div>
                  <p className="text-sm text-foreground mb-2">{prediction.question || `${prediction.tokenName} call`}</p>
                  <p className="text-xs text-muted-foreground">You answered {prediction.binaryAnswer === 'yes' ? 'Yes' : prediction.binaryAnswer === 'no' ? 'No' : prediction.prediction === 'moon' ? 'Yes' : 'No'} • {prediction.timeframe}</p>
                </div>
              ))}
              {myPredictions.length === 0 ? (
                <div className="p-3 rounded-lg bg-background-subtle text-sm text-foreground-muted">
                  You have not made a prophet call yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
