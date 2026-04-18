import { useParams, Link } from 'react-router';
import { Trophy, Target, Swords, Award, ArrowLeft, Fingerprint } from 'lucide-react';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { predictionApi, userApi } from '../services/api';

export function PassportPage() {
  const { username } = useParams<{ username: string }>();
  const { data: profile, loading: profileLoading } = useApi(() => username ? userApi.getProfile(username) : Promise.resolve(undefined), [username]);
  const { data: predictions, loading: predictionsLoading } = useApi(() => username ? predictionApi.getByUser(username) : Promise.resolve([]), [username]);

  if (profileLoading || predictionsLoading) return <LoadingState message="Loading passport profile..." />;

  if (!profile) {
    return <div className="p-8"><EmptyState icon={<Fingerprint className="w-8 h-8" />} title="Passport profile not found" description="This Sloan profile does not exist in the live backend yet." action={<Link to="/dashboard" className="text-primary hover:underline">Return to Command Center</Link>} /></div>;
  }

  const userPredictions = predictions || [];
  const correctCount = userPredictions.filter(pred => pred.status === 'correct').length;
  const totalPredictions = userPredictions.length || 1;
  const prophetScore = Math.min(96, Math.round((correctCount / totalPredictions) * 100) || 72);
  const raiderScore = Math.min(95, Math.max(24, Math.round(profile.raiderImpact / 15)));
  const trustScore = Math.min(98, 60 + profile.badges.length * 8);

  return (
    <div className="p-8 space-y-8">
      <div><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"><ArrowLeft className="w-4 h-4" />Back to Command Center</Link></div>

      <div className="p-8 rounded-2xl bg-gradient-to-br from-background-elevated via-background-subtle to-background-elevated border border-card-border">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center text-4xl">{profile.username.slice(0, 2).toUpperCase()}</div>
          <div className="flex-1">
            <h1 className="text-3xl text-foreground mb-2">{profile.displayName}</h1>
            <p className="text-muted-foreground mb-4">@{profile.username}</p>
            <div className="flex items-center gap-3 mb-4 flex-wrap"><span className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">{profile.archetype}</span><span className="px-4 py-2 rounded-lg bg-accent-dim text-foreground border border-border">Joined {new Date(profile.joinedDate).toLocaleDateString()}</span></div>
            <div className="flex flex-wrap gap-2">{profile.badges.map((badge, i) => <span key={i} className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm border border-warning/20">{badge}</span>)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-lg bg-card border border-card-border"><div className="flex items-center gap-2 text-muted-foreground mb-2"><Trophy className="w-5 h-5" /><span className="text-sm">Prophet Rank</span></div><p className="text-3xl text-foreground font-mono">#{profile.prophetRank}</p></div>
        <div className="p-6 rounded-lg bg-card border border-card-border"><div className="flex items-center gap-2 text-muted-foreground mb-2"><Target className="w-5 h-5" /><span className="text-sm">Raider Impact</span></div><p className="text-3xl text-foreground font-mono">{profile.raiderImpact.toLocaleString()}</p></div>
        <div className="p-6 rounded-lg bg-card border border-card-border"><div className="flex items-center gap-2 text-muted-foreground mb-2"><Swords className="w-5 h-5" /><span className="text-sm">Quests Completed</span></div><p className="text-3xl text-foreground font-mono">{profile.questsCompleted}</p></div>
        <div className="p-6 rounded-lg bg-card border border-card-border"><div className="flex items-center gap-2 text-muted-foreground mb-2"><Award className="w-5 h-5" /><span className="text-sm">Badges Earned</span></div><p className="text-3xl text-foreground font-mono">{profile.badges.length}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Recent Predictions</h3>
            {userPredictions.length > 0 ? <div className="space-y-4">{userPredictions.map(pred => <div key={pred.id} className="p-4 rounded-lg bg-background-subtle border border-border"><div className="flex items-start justify-between mb-2"><Link to={`/dashboard/token/${pred.tokenSlug}`} className="text-foreground hover:text-primary transition-colors">{pred.tokenName}</Link><span className={`px-2 py-1 rounded text-xs font-mono ${pred.prediction === 'moon' ? 'bg-success/10 text-success' : pred.prediction === 'dump' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>{pred.prediction.toUpperCase()}</span></div><p className="text-sm text-muted-foreground mb-2">{pred.targetPrice ? `Target: $${pred.targetPrice.toFixed(4)} • ` : ''}{pred.timeframe}</p><p className="text-sm text-foreground-muted">{pred.reasoning}</p><p className="text-xs text-muted-foreground mt-2">{new Date(pred.timestamp).toLocaleDateString()}</p></div>)}</div> : <p className="text-muted-foreground text-center py-8">No predictions recorded yet</p>}
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border"><h3 className="text-foreground mb-4">Achievement Showcase</h3><div className="grid grid-cols-2 gap-4">{profile.badges.map((badge, i) => <div key={i} className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 text-center"><Award className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-sm text-foreground">{badge}</p></div>)}</div></div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border"><h3 className="text-foreground mb-4">Favorite Categories</h3><div className="space-y-2">{profile.favoriteCategories.map((cat, i) => <div key={i} className="px-4 py-2 rounded-lg bg-accent-dim text-foreground">{cat}</div>)}</div></div>
          <div className="p-6 rounded-lg bg-card border border-card-border"><h3 className="text-foreground mb-4">Reputation Breakdown</h3><div className="space-y-4">{[{ label: 'Prophet skills', score: prophetScore, tone: 'bg-primary' }, { label: 'Raider activity', score: raiderScore, tone: 'bg-success' }, { label: 'Community trust', score: trustScore, tone: 'bg-warning' }].map(item => <div key={item.label}><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">{item.label}</span><span className="text-sm text-foreground font-mono">{item.score}/100</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`${item.tone} h-full`} style={{ width: `${item.score}%` }} /></div></div>)}</div></div>
          {username === 'current_user' && <div className="p-6 rounded-lg bg-card border border-card-border"><h3 className="text-foreground mb-4">Profile Actions</h3><div className="space-y-2"><Link to="/dashboard/settings" className="block w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-center">Edit Profile</Link><button className="w-full px-4 py-3 rounded-lg border border-border hover:border-primary/40 transition-all">Share Profile</button></div></div>}
        </div>
      </div>
    </div>
  );
}
