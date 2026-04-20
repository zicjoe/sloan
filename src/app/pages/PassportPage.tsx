import { useParams, Link } from 'react-router';
import { Trophy, Target, Swords, Award, ArrowLeft, Fingerprint } from 'lucide-react';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { predictionApi, userApi, prophetApi, questApi, tokenApi } from '../services/api';
import { useAuth } from '../auth/AuthContext';

function inferArchetype(predictionsCount: number, accuracy: number, questsCompleted: number) {
  if (accuracy >= 70 && predictionsCount >= 5) return 'Signal sniper';
  if (questsCompleted >= 5) return 'Quest closer';
  if (predictionsCount >= 3) return 'Conviction builder';
  return 'Radar scout';
}

function deriveBadges(predictionsCount: number, accuracy: number, questsCompleted: number) {
  const badges: string[] = [];
  if (predictionsCount >= 1) badges.push('First call');
  if (predictionsCount >= 5) badges.push('Active prophet');
  if (accuracy >= 60 && predictionsCount >= 3) badges.push('Good read');
  if (accuracy >= 75 && predictionsCount >= 5) badges.push('Sharp conviction');
  if (questsCompleted >= 1) badges.push('Quest joined');
  if (questsCompleted >= 3) badges.push('Quest closer');
  return badges;
}

export function PassportPage() {
  const { username } = useParams<{ username: string }>();
  const { profile: authProfile, isAuthenticated } = useAuth();
  const resolvedUsername = username || authProfile?.username;
  const isOwnProfile = Boolean(
    isAuthenticated &&
    authProfile?.username &&
    resolvedUsername &&
    authProfile.username.toLowerCase() === resolvedUsername.toLowerCase(),
  );

  const { data: profile, loading: profileLoading } = useApi(
    () => resolvedUsername ? userApi.getProfile(resolvedUsername) : Promise.resolve(undefined),
    [resolvedUsername],
  );
  const { data: predictions, loading: predictionsLoading } = useApi(
    () => resolvedUsername ? predictionApi.getByUser(resolvedUsername) : Promise.resolve([]),
    [resolvedUsername],
  );

  const { data: fallbackContext, loading: fallbackLoading } = useApi(async () => {
    if (!isOwnProfile || profile || !authProfile?.username) return undefined;

    const [prophet, questLeaderboard, tokens] = await Promise.all([
      prophetApi.getByUsername(authProfile.username).catch(() => undefined),
      questApi.getLeaderboard().catch(() => []),
      tokenApi.getAll().catch(() => []),
    ]);

    return { prophet, questLeaderboard, tokens };
  }, [isOwnProfile, profile?.username || '', authProfile?.username || '']);

  const userPredictions = predictions || [];

  const effectiveProfile = profile || (() => {
    if (!isOwnProfile || !authProfile || !fallbackContext) return undefined;

    const questEntry = (fallbackContext.questLeaderboard || []).find((entry: any) => entry.username === authProfile.username);
    const correctCount = userPredictions.filter((prediction) => prediction.status === 'correct').length;
    const resolvedCount = userPredictions.filter((prediction) => prediction.status !== 'pending').length;
    const accuracy = resolvedCount > 0 ? Math.round((correctCount / resolvedCount) * 100) : 0;

    const tokenBySlug = new Map((fallbackContext.tokens || []).map((token: any) => [token.slug, token]));
    const categoryCounts = new Map<string, number>();
    for (const prediction of userPredictions) {
      const category = tokenBySlug.get(prediction.tokenSlug)?.category;
      if (!category) continue;
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }

    const favoriteCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const questsCompleted = questEntry?.completed ?? 0;
    const raiderImpact = Math.max(
      questEntry?.xp ?? 0,
      userPredictions.length * 18 + questsCompleted * 65 + correctCount * 25,
    );

    return {
      username: authProfile.username,
      displayName: authProfile.display_name || authProfile.username,
      avatar: authProfile.avatar_url || undefined,
      archetype: inferArchetype(userPredictions.length, accuracy, questsCompleted),
      prophetRank: fallbackContext.prophet?.rank ?? 0,
      raiderImpact,
      questsCompleted,
      favoriteCategories: favoriteCategories.length > 0 ? favoriteCategories : ['Meme'],
      joinedDate: authProfile.created_at || new Date().toISOString(),
      badges: deriveBadges(userPredictions.length, accuracy, questsCompleted),
    };
  })();

  if (profileLoading || predictionsLoading || (isOwnProfile && !profile && fallbackLoading)) {
    return <LoadingState message="Loading passport profile..." />;
  }

  if (!effectiveProfile) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<Fingerprint className="w-8 h-8" />}
          title="Passport profile not found"
          description={isOwnProfile
            ? 'Your live profile exists, but Passport still could not build the public view. This needs a code fix, not another profile save.'
            : 'This Sloan profile does not exist in the live backend yet.'}
          action={
            <Link to={isOwnProfile ? '/dashboard' : '/dashboard'} className="text-primary hover:underline">
              Return to Command Center
            </Link>
          }
        />
      </div>
    );
  }

  const correctCount = userPredictions.filter(pred => pred.status === 'correct').length;
  const totalPredictions = userPredictions.length || 1;
  const prophetScore = Math.min(96, Math.round((correctCount / totalPredictions) * 100) || 72);
  const raiderScore = Math.min(95, Math.max(24, Math.round(effectiveProfile.raiderImpact / 15)));
  const trustScore = Math.min(98, 60 + effectiveProfile.badges.length * 8);

  return (
    <div className="p-8 space-y-8">
      <div><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"><ArrowLeft className="w-4 h-4" />Back to Command Center</Link></div>

      <div className="p-8 rounded-2xl bg-gradient-to-br from-background-elevated via-background-subtle to-background-elevated border border-card-border">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center text-4xl">{effectiveProfile.username.slice(0, 2).toUpperCase()}</div>
          <div className="flex-1">
            <h1 className="text-3xl text-foreground mb-2">{effectiveProfile.displayName}</h1>
            <p className="text-muted-foreground mb-4">@{effectiveProfile.username}</p>
            <div className="flex items-center gap-3 mb-4 flex-wrap"><span className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">{effectiveProfile.archetype}</span><span className="px-4 py-2 rounded-lg bg-accent-dim text-foreground border border-border">Joined {new Date(effectiveProfile.joinedDate).toLocaleDateString()}</span></div>
            <div className="flex flex-wrap gap-2">{effectiveProfile.badges.map((badge, i) => <span key={i} className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm border border-warning/20">{badge}</span>)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-lg bg-card border border-card-border"><div className="flex items-center gap-2 text-muted-foreground mb-2"><Trophy className="w-5 h-5" /><span className="text-sm">Prophet Rank</span></div><p className="text-3xl text-foreground font-mono">#{effectiveProfile.prophetRank}</p></div>
        <div className="p-6 rounded-lg bg-card border border-card-border"><div className="flex items-center gap-2 text-muted-foreground mb-2"><Target className="w-5 h-5" /><span className="text-sm">Raider Impact</span></div><p className="text-3xl text-foreground font-mono">{effectiveProfile.raiderImpact.toLocaleString()}</p></div>
        <div className="p-6 rounded-lg bg-card border border-card-border"><div className="flex items-center gap-2 text-muted-foreground mb-2"><Swords className="w-5 h-5" /><span className="text-sm">Quests Completed</span></div><p className="text-3xl text-foreground font-mono">{effectiveProfile.questsCompleted}</p></div>
        <div className="p-6 rounded-lg bg-card border border-card-border"><div className="flex items-center gap-2 text-muted-foreground mb-2"><Award className="w-5 h-5" /><span className="text-sm">Badges Earned</span></div><p className="text-3xl text-foreground font-mono">{effectiveProfile.badges.length}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Recent Predictions</h3>
            {userPredictions.length > 0 ? <div className="space-y-4">{userPredictions.map(pred => <div key={pred.id} className="p-4 rounded-lg bg-background-subtle border border-border"><div className="flex items-start justify-between mb-2"><Link to={`/dashboard/token/${pred.tokenSlug}`} className="text-foreground hover:text-primary transition-colors">{pred.tokenName}</Link><span className={`px-2 py-1 rounded text-xs font-mono ${pred.prediction === 'moon' ? 'bg-success/10 text-success' : pred.prediction === 'dump' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>{pred.prediction.toUpperCase()}</span></div><p className="text-sm text-muted-foreground mb-2">{pred.targetPrice ? `Target: $${pred.targetPrice.toFixed(4)} • ` : ''}{pred.timeframe}</p><p className="text-sm text-foreground-muted">{pred.reasoning}</p><p className="text-xs text-muted-foreground mt-2">{new Date(pred.timestamp).toLocaleDateString()}</p></div>)}</div> : <p className="text-muted-foreground text-center py-8">No predictions recorded yet</p>}
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border"><h3 className="text-foreground mb-4">Achievement Showcase</h3><div className="grid grid-cols-2 gap-4">{effectiveProfile.badges.map((badge, i) => <div key={i} className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 text-center"><Award className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-sm text-foreground">{badge}</p></div>)}</div></div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border"><h3 className="text-foreground mb-4">Favorite Categories</h3><div className="space-y-2">{effectiveProfile.favoriteCategories.map((cat, i) => <div key={i} className="px-4 py-2 rounded-lg bg-accent-dim text-foreground">{cat}</div>)}</div></div>
          <div className="p-6 rounded-lg bg-card border border-card-border"><h3 className="text-foreground mb-4">Reputation Breakdown</h3><div className="space-y-4">{[{ label: 'Prophet skills', score: prophetScore, tone: 'bg-primary' }, { label: 'Raider activity', score: raiderScore, tone: 'bg-success' }, { label: 'Community trust', score: trustScore, tone: 'bg-warning' }].map(item => <div key={item.label}><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">{item.label}</span><span className="text-sm text-foreground font-mono">{item.score}/100</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`${item.tone} h-full`} style={{ width: `${item.score}%` }} /></div></div>)}</div></div>
          {isOwnProfile && <div className="p-6 rounded-lg bg-card border border-card-border"><h3 className="text-foreground mb-4">Profile Actions</h3><div className="space-y-2"><Link to="/dashboard/settings" className="block w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-center">Edit Profile</Link><button className="w-full px-4 py-3 rounded-lg border border-border hover:border-primary/40 transition-all">Share Profile</button></div></div>}
        </div>
      </div>
    </div>
  );
}
