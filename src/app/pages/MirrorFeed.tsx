import { RotateCcw, AlertTriangle, TrendingDown, TrendingUp, Brain } from 'lucide-react';
import { Link } from 'react-router';
import { SectionHeader } from '../components/SectionHeader';
import { mockCounterfactuals } from '../data/users';

export function MirrorFeed() {
  const totalMissed = mockCounterfactuals.reduce((sum, cf) => sum + cf.potentialGain, 0);
  const patterns = [
    'Panic selling on -15% moves',
    'Analysis paralysis on high-momentum plays',
    'Greedy holds past profit targets',
    'FOMO buying without conviction check',
  ];

  return (
    <div className="p-8 space-y-8">
      <SectionHeader
        title="Mirror Feed"
        subtitle="Learn from your missed opportunities"
        icon={<RotateCcw className="w-5 h-5" />}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">Total Missed Opportunities</span>
          </div>
          <p className="text-3xl text-foreground font-mono">{mockCounterfactuals.length}</p>
        </div>
        <div className="p-6 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Potential Gain/Loss</span>
          </div>
          <p className={`text-3xl font-mono ${totalMissed >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalMissed >= 0 ? '+' : ''}${totalMissed.toLocaleString()}
          </p>
        </div>
        <div className="p-6 rounded-lg bg-card border border-card-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Brain className="w-5 h-5" />
            <span className="text-sm">Patterns Identified</span>
          </div>
          <p className="text-3xl text-foreground font-mono">{patterns.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Counterfactual Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-foreground">Missed Opportunities</h3>
          {mockCounterfactuals.map(cf => {
            const isPositive = cf.potentialGain > 0;
            return (
              <div
                key={cf.id}
                className={`
                  p-6 rounded-lg border transition-all
                  ${isPositive
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-success/5 border-success/20'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Link
                      to={`/dashboard/token/${cf.tokenSlug}`}
                      className="text-foreground hover:text-primary transition-colors mb-1 block"
                    >
                      {cf.tokenName}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {new Date(cf.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg
                    ${isPositive ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}
                  `}>
                    {isPositive ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    <span className="font-mono">
                      {isPositive ? '+' : ''}{cf.potentialGain >= 0 ? '+' : ''}${Math.abs(cf.potentialGain).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">What Happened</p>
                  <p className="text-foreground">{cf.missedAction}</p>
                </div>

                <div className="p-4 rounded-lg bg-accent-dim border border-border">
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Insight</p>
                      <p className="text-sm text-foreground">{cf.insight}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column - Insights & Patterns */}
        <div className="space-y-6">
          {/* Behavior Patterns */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Repeated Patterns</h3>
            <div className="space-y-3">
              {patterns.map((pattern, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-warning/5 border border-warning/20"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{pattern}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Edge */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Your Edge</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <p className="text-sm text-muted-foreground mb-1">Strength</p>
                <p className="text-sm text-foreground">
                  Good at identifying early AI narrative plays
                </p>
              </div>
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <p className="text-sm text-muted-foreground mb-1">Strength</p>
                <p className="text-sm text-foreground">
                  Quick to spot community momentum shifts
                </p>
              </div>
            </div>
          </div>

          {/* Improvement Areas */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Areas to Improve</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-accent-dim border border-border">
                <p className="text-sm text-muted-foreground mb-1">Focus Area</p>
                <p className="text-sm text-foreground">
                  Set stop losses and stick to them
                </p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-warning" style={{ width: '30%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">30% adherence</p>
              </div>
              <div className="p-4 rounded-lg bg-accent-dim border border-border">
                <p className="text-sm text-muted-foreground mb-1">Focus Area</p>
                <p className="text-sm text-foreground">
                  Check conviction score before selling
                </p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-warning" style={{ width: '45%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">45% adherence</p>
              </div>
            </div>
          </div>

          {/* Reflective Summary */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-5 h-5 text-primary" />
              <h3 className="text-foreground">Weekly Reflection</h3>
            </div>
            <p className="text-sm text-foreground-muted leading-relaxed">
              This week you made 5 trades. You were right about the direction 3 times, but execution issues cost you gains. Focus on: setting clear exit points before entering positions, and trusting conviction scores over emotional reactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
