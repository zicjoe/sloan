import { Swords, Target, Trophy, Flame } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { QuestCard } from '../components/QuestCard';
import { mockQuests } from '../data/quests';
import { useState } from 'react';

export function QuestArena() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Quests', count: mockQuests.length },
    { id: 'posting', label: 'Posting', count: mockQuests.filter(q => q.category === 'posting').length },
    { id: 'prediction', label: 'Prediction', count: mockQuests.filter(q => q.category === 'prediction').length },
    { id: 'meme', label: 'Meme Creation', count: mockQuests.filter(q => q.category === 'meme').length },
    { id: 'rivalry', label: 'Rivalry', count: mockQuests.filter(q => q.category === 'rivalry').length },
    { id: 'recovery', label: 'Recovery', count: mockQuests.filter(q => q.category === 'recovery').length },
  ];

  const filteredQuests = selectedCategory === 'all'
    ? mockQuests
    : mockQuests.filter(q => q.category === selectedCategory);

  const completedCount = mockQuests.filter(q => q.completed).length;
  const totalXP = mockQuests.filter(q => q.completed).reduce((sum, q) => sum + q.reward, 0);

  return (
    <div className="p-8 space-y-8">
      <SectionHeader
        title="Quest Arena"
        subtitle="Complete quests to earn XP and climb the ranks"
        icon={<Swords className="w-5 h-5" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm">Active Quests</span>
          </div>
          <p className="text-3xl text-foreground font-mono">
            {mockQuests.filter(q => !q.completed).length}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="text-3xl text-foreground font-mono">{completedCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-sm">Current Streak</span>
          </div>
          <p className="text-3xl text-foreground font-mono">7</p>
          <p className="text-xs text-success mt-1">days</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">Total XP Earned</span>
          </div>
          <p className="text-3xl text-foreground font-mono">{totalXP}</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              px-4 py-2 rounded-lg border transition-all whitespace-nowrap
              ${selectedCategory === cat.id
                ? 'bg-primary/10 text-primary border-primary/40'
                : 'bg-card text-muted-foreground border-border hover:border-primary/20'
              }
            `}
          >
            {cat.label}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-background-subtle text-xs">
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Quest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuests.map(quest => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </div>

      {/* Empty State */}
      {filteredQuests.length === 0 && (
        <div className="text-center py-12">
          <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground-muted">No quests in this category</p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="mt-4 text-primary hover:underline"
          >
            View all quests
          </button>
        </div>
      )}
    </div>
  );
}
