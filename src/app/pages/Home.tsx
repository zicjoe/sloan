import { Activity, TrendingUp, Users, Zap } from 'lucide-react';
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
  const { data: tokens, loading: tokensLoading } = useApi(tokenApi.getAll);
  const { data: quests, loading: questsLoading } = useApi(questApi.getAll);
  const { data: prophets, loading: prophetsLoading } = useApi(prophetApi.getLeaderboard);
  const { data: predictions, loading: predictionsLoading } = useApi(predictionApi.getAll);

  const loading = tokensLoading || questsLoading || prophetsLoading || predictionsLoading;

  if (loading) {
    return <LoadingState message="Booting Sloan command center..." />;
  }

  const trendingTokens = (tokens || []).filter(t => t.momentum === 'rising').slice(0, 3);
  const activeQuests = (quests || []).filter(q => !q.completed).slice(0, 3);
  const topProphets = (prophets || []).slice(0, 5);
  const recentPredictions = (predictions || []).slice(0, 4);

  if (!tokens?.length) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<Zap className="w-8 h-8" />}
          title="No command center data yet"
          description="Once tokens are connected, Sloan will fill this page with live conviction, quest, and prophet data."
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
            Command Center for Meme Token Intelligence
          </h1>
          <p className="text-lg text-foreground-muted max-w-2xl mb-6">
            Sloan turns meme launches into readable signal with conviction scoring, community loops, and prediction reputation in one place.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/token/pepeai" className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              Explore Tokens
            </Link>
            <Link to="/dashboard/forge" className="px-6 py-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-all">
              Launch a Project
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Activity className="w-4 h-4" />} label="Active Tokens" value={tokens.length} subtitle="Live in Sloan" trend="up" />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Avg Accuracy" value="78.4%" subtitle="Prophet baseline" trend="up" />
        <StatCard icon={<Users className="w-4 h-4" />} label="Active Prophets" value={topProphets.length} subtitle="Making calls now" />
        <StatCard icon={<Zap className="w-4 h-4" />} label="Live Quests" value={activeQuests.length} subtitle="Complete for XP" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-foreground">Trending Tokens</h2>
            <Link to="/dashboard/token/pepeai" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="grid gap-4">
            {trendingTokens.map(token => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-foreground">Prophet Leaderboard</h2>
            <Link to="/dashboard/prophets" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {topProphets.map(prophet => (
              <ProphetRow key={prophet.username} prophet={prophet} variant="compact" />
            ))}
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
          {activeQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
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
          {recentPredictions.map(prediction => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      </div>
    </div>
  );
}
