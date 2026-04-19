import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ClipboardCheck, Flame, Swords, Target, UserPlus } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { QuestCard } from '../components/QuestCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { questApi } from '../services/api';

const categoryLabels: Record<string, string> = {
  all: 'All Quests',
  posting: 'Posting',
  prediction: 'Prediction',
  meme: 'Meme Creation',
  rivalry: 'Rivalry',
  recovery: 'Recovery',
};

export function QuestArena() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';

  const { data: quests, loading } = useApi(questApi.getAll);
  const { data: myActivity } = useApi(questApi.getMyActivity);

  const liveQuests = quests || [];

  const categories = useMemo(() => {
    const counts = liveQuests.reduce<Record<string, number>>((acc, quest) => {
      acc[quest.category] = (acc[quest.category] || 0) + 1;
      return acc;
    }, {});

    return [
      { id: 'all', label: categoryLabels.all, count: liveQuests.length },
      { id: 'posting', label: categoryLabels.posting, count: counts.posting || 0 },
      { id: 'prediction', label: categoryLabels.prediction, count: counts.prediction || 0 },
      { id: 'meme', label: categoryLabels.meme, count: counts.meme || 0 },
      { id: 'rivalry', label: categoryLabels.rivalry, count: counts.rivalry || 0 },
      { id: 'recovery', label: categoryLabels.recovery, count: counts.recovery || 0 },
    ];
  }, [liveQuests]);

  const filteredQuests = selectedCategory === 'all'
    ? liveQuests
    : liveQuests.filter((quest) => quest.category === selectedCategory);

  const completedCount = liveQuests.filter((quest) => quest.completed).length;
  const activeCount = liveQuests.filter((quest) => !quest.completed).length;
  const averageProgress = activeCount > 0
    ? Math.round(liveQuests.filter((quest) => !quest.completed).reduce((sum, quest) => sum + (quest.progress || 0), 0) / activeCount)
    : 0;

  if (loading) return <LoadingState message="Loading live quests..." />;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader
          title="Quest Arena"
          subtitle="Community missions now work best when a meme owner or operator publishes them with Sloan AI assistance. Open Quest Forge to draft and publish the next mission."
          icon={<Swords className="w-5 h-5" />}
        />
        <Link
          to="/dashboard/quests/forge"
          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary transition hover:bg-primary/15"
        >
          <Flame className="w-4 h-4" />
          Open Quest Forge
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Target className="w-4 h-4" /><span className="text-sm">Active Quests</span></div>
          <p className="text-3xl text-foreground font-mono">{activeCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><UserPlus className="w-4 h-4" /><span className="text-sm">Joined Missions</span></div>
          <p className="text-3xl text-foreground font-mono">{myActivity?.joinedCount || 0}</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Flame className="w-4 h-4" /><span className="text-sm">Total XP Earned</span></div>
          <p className="text-3xl text-foreground font-mono">{myActivity?.totalXp || 0}</p>
          <p className="text-xs text-success mt-1">{myActivity?.streak || 0} quest streak</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><ClipboardCheck className="w-4 h-4" /><span className="text-sm">Completion Rate</span></div>
          <p className="text-3xl text-foreground font-mono">{completedCount > 0 ? `${Math.round((completedCount / Math.max(1, liveQuests.length)) * 100)}%` : `${averageProgress}%`}</p>
          <p className="text-xs text-muted-foreground mt-1">live progress pulse</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSearchParams(category.id === 'all' ? {} : { category: category.id })}
            className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${selectedCategory === category.id ? 'bg-primary/10 text-primary border-primary/40' : 'bg-card text-muted-foreground border-border hover:border-primary/20'}`}
          >
            {category.label}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-background-subtle text-xs">{category.count}</span>
          </button>
        ))}
      </div>

      {filteredQuests.length > 0 ? (
        <div className="space-y-6">
          <div className="rounded-xl bg-card border border-card-border p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-foreground text-lg">Live Mission Queue</h3>
                <p className="text-sm text-muted-foreground">Published owner quests appear first. Sloan fallback quests only appear when a token has no operator-led mission live yet.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs border bg-primary/10 text-primary border-primary/20">route-based demo</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuests.map((quest) => (
                <Link
                  key={quest.id}
                  to={`/dashboard/quests/${quest.id}${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`}
                  className="block"
                >
                  <QuestCard quest={quest} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <EmptyState icon={<Swords className="w-8 h-8" />} title="No live quests in this category" description="Publish a mission from Quest Forge and it will appear here for the community instantly." />
          <Link
            to="/dashboard/quests/forge"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary transition hover:bg-primary/15"
          >
            <Flame className="w-4 h-4" />
            Create the first quest
          </Link>
        </div>
      )}
    </div>
  );
}
