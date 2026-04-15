import { Trophy, TrendingUp, Target, Award } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { ProphetRow } from '../components/ProphetRow';
import { PredictionCard } from '../components/PredictionCard';
import { StatCard } from '../components/StatCard';
import { LoadingState } from '../components/LoadingState';
import { useApi, useMutation } from '../hooks/useApi';
import { predictionApi, prophetApi, tokenApi } from '../services/api';
import type { Prediction } from '../types';

export function ProphetLeague() {
  const [formData, setFormData] = useState({
    tokenSlug: 'pepeai',
    prediction: 'moon' as Prediction['prediction'],
    targetPrice: '0.0100',
    timeframe: '7 days',
    reasoning: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: prophets, loading: prophetsLoading } = useApi(prophetApi.getLeaderboard, [refreshKey]);
  const { data: predictions, loading: predictionsLoading, refetch } = useApi(predictionApi.getAll, [refreshKey]);
  const { data: tokens } = useApi(tokenApi.getAll);
  const { mutate, loading: createLoading } = useMutation(predictionApi.create);

  const loading = prophetsLoading || predictionsLoading;

  const trendingCalls = useMemo(() => {
    return (predictions || []).slice(0, 3);
  }, [predictions]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await mutate({
      tokenSlug: formData.tokenSlug,
      prediction: formData.prediction,
      timeframe: formData.timeframe,
      targetPrice: Number(formData.targetPrice) || undefined,
      reasoning: formData.reasoning || 'Structured prediction created in Sloan.',
    });

    if (result) {
      setFormData(prev => ({ ...prev, reasoning: '' }));
      setRefreshKey(value => value + 1);
      refetch();
    }
  }

  if (loading) {
    return <LoadingState message="Loading prophet league..." />;
  }

  return (
    <div className="p-8 space-y-8">
      <SectionHeader
        title="Prophet League"
        subtitle="Make predictions, climb the ranks"
        icon={<Trophy className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Top Prophets</h3>
            <div className="space-y-3">
              {(prophets || []).map((prophet, index) => (
                <ProphetRow key={prophet.username} prophet={prophet} rank={index} variant="detailed" />
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Recent Predictions</h3>
            <div className="space-y-4">
              {(predictions || []).map(prediction => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Make Prediction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Token</label>
                <select value={formData.tokenSlug} onChange={(e) => setFormData(prev => ({ ...prev, tokenSlug: e.target.value }))} className="w-full px-4 py-2 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                  {(tokens || []).map(token => <option key={token.id} value={token.slug}>{token.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Prediction</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['moon', 'sideways', 'dump'] as Prediction['prediction'][]).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, prediction: option }))}
                      className={`px-4 py-3 rounded-lg border transition-all ${formData.prediction === option ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background-subtle text-foreground'}`}
                    >
                      {option.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Target Price</label>
                <input value={formData.targetPrice} onChange={(e) => setFormData(prev => ({ ...prev, targetPrice: e.target.value }))} type="text" placeholder="0.0050" className="w-full px-4 py-2 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none font-mono" />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Timeframe</label>
                <select value={formData.timeframe} onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value }))} className="w-full px-4 py-2 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                  <option>24 hours</option>
                  <option>3 days</option>
                  <option>7 days</option>
                  <option>14 days</option>
                  <option>30 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Reasoning</label>
                <textarea value={formData.reasoning} onChange={(e) => setFormData(prev => ({ ...prev, reasoning: e.target.value }))} placeholder="Share your analysis..." className="w-full px-4 py-2 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none" rows={4} />
              </div>

              <button type="submit" disabled={createLoading} className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70">
                {createLoading ? 'Submitting...' : 'Submit Prediction'}
              </button>
            </form>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Your Prophet Stats</h3>
            <div className="space-y-4">
              <StatCard icon={<Target className="w-4 h-4 text-primary" />} label="Rank" value="#12" subtitle="rising profile" trend="up" />
              <StatCard icon={<TrendingUp className="w-4 h-4 text-primary" />} label="Accuracy" value="72.5%" subtitle="demo baseline" />
              <StatCard icon={<Award className="w-4 h-4 text-primary" />} label="Current Streak" value="4" subtitle="predictions" />
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Trending Calls</h3>
            <div className="space-y-3">
              {trendingCalls.map(call => (
                <div key={call.id} className="p-3 rounded-lg bg-background-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{call.tokenName}</span>
                    <span className={`text-sm ${call.prediction === 'moon' ? 'text-success' : call.prediction === 'dump' ? 'text-destructive' : 'text-warning'}`}>{call.prediction.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{call.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
