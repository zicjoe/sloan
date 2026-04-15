import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Target, Users, Sparkles, WandSparkles } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { useApi, useMutation } from '../hooks/useApi';
import { predictionApi, raidApi, tokenApi } from '../services/api';

function narrativeForSlug(slug?: string) {
  switch (slug) {
    case 'pepeai':
      return 'PepeAI is riding the convergence of AI hype and meme culture. Strong community momentum and a clean meme identity keep attention sticky while exchange rumors keep traders alert.';
    case 'moon-cat':
      return 'Moon Cat Protocol is being carried by social proof, visual branding, and celebrity adjacency. It behaves like a meme that communities want to wear, not just trade.';
    case 'wojak-terminal':
      return 'Wojak Terminal has a sharp trader aesthetic but weaker emotional pull. It needs stronger community proof to stop feeling like a chart-first meme.';
    default:
      return 'This launch has signal, but the crowd still needs a cleaner reason to stay. Watch identity strength versus raw attention.';
  }
}

export function TokenPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [contentOutput, setContentOutput] = useState<string[]>([]);
  const { data: token, loading: tokenLoading } = useApi(() => tokenApi.getBySlug(slug), [slug]);
  const { data: conviction, loading: convictionLoading } = useApi(() => tokenApi.getConviction(slug), [slug]);
  const { data: swarm, loading: swarmLoading } = useApi(() => tokenApi.getSwarmData(slug), [slug]);
  const { data: lore, loading: loreLoading } = useApi(() => tokenApi.getLoreStream(slug), [slug]);
  const { mutate: generateContent, loading: generatingContent } = useMutation(raidApi.generateContent);
  const { mutate: createPrediction, loading: creatingPrediction } = useMutation(predictionApi.create);

  const loading = tokenLoading || convictionLoading || swarmLoading || loreLoading;
  const isPositive = (token?.priceChange24h || 0) > 0;
  const narrative = useMemo(() => narrativeForSlug(token?.slug), [token?.slug]);

  async function handleGenerateContent() {
    if (!token) return;
    const result = await generateContent({
      token: token.name,
      platform: 'X',
      vibe: 'bold',
      objective: 'push smart attention',
    });

    if (result?.content?.variants) {
      setContentOutput(result.content.variants);
    }
  }

  async function handleQuickPrediction(direction: 'moon' | 'sideways' | 'dump') {
    if (!token) return;
    await createPrediction({
      tokenSlug: token.slug,
      prediction: direction,
      timeframe: '7 days',
      reasoning: `Quick ${direction} call from Sloan token page based on live conviction and crowd posture.`,
      targetPrice: direction === 'moon' ? token.price * 1.5 : direction === 'dump' ? token.price * 0.75 : token.price,
    });
  }

  if (loading) {
    return <LoadingState message="Loading token intelligence..." />;
  }

  if (!token) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          title="Token not found"
          description="This token is not available in Sloan yet."
          action={<Link to="/dashboard" className="text-primary hover:underline">Return to Command Center</Link>}
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl text-foreground">{token.name}</h1>
              <span className="px-3 py-1 rounded-lg bg-accent-dim text-muted-foreground font-mono">${token.ticker}</span>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-4xl font-mono text-foreground">${token.price.toFixed(4)}</p>
              <span className={`flex items-center gap-1 px-3 py-1.5 rounded text-lg font-mono ${isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive && '+'}{token.priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleGenerateContent} className="px-4 py-2 rounded-lg border border-border hover:border-primary/40 transition-all">
              {generatingContent ? 'Generating...' : 'Generate Content'}
            </button>
            <Link to="/dashboard/raid-studio" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              Start Raid
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-card border border-card-border"><p className="text-sm text-muted-foreground mb-1">Market Cap</p><p className="text-xl font-mono text-foreground">${(token.marketCap / 1000000).toFixed(2)}M</p></div>
        <div className="p-4 rounded-lg bg-card border border-card-border"><p className="text-sm text-muted-foreground mb-1">24h Volume</p><p className="text-xl font-mono text-foreground">${(token.volume24h / 1000000).toFixed(2)}M</p></div>
        <div className="p-4 rounded-lg bg-card border border-card-border"><p className="text-sm text-muted-foreground mb-1">Holders</p><p className="text-xl font-mono text-foreground">{token.holders.toLocaleString()}</p></div>
        <div className="p-4 rounded-lg bg-card border border-card-border"><p className="text-sm text-muted-foreground mb-1">Momentum</p><p className="text-xl text-foreground capitalize">{token.momentum}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <SectionHeader title="Narrative Scan" subtitle="AI-powered narrative analysis" icon={<Sparkles className="w-5 h-5" />} />
            <div className="p-4 rounded-lg bg-accent-dim border border-border">
              <p className="text-foreground leading-relaxed">{narrative}</p>
            </div>
          </div>

          {conviction && (
            <div className="p-6 rounded-lg bg-card border border-card-border">
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Conviction Analysis" />
                <div className="text-right">
                  <p className="text-3xl font-mono text-primary">{conviction.convictionScore}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
              <div className="space-y-4">
                <div><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-success" /><h3 className="text-sm text-success">Bull Case</h3></div><ul className="space-y-1.5 ml-6">{conviction.bullCase.map((point, i) => <li key={i} className="text-sm text-foreground-muted list-disc">{point}</li>)}</ul></div>
                <div><div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-destructive" /><h3 className="text-sm text-destructive">Bear Case</h3></div><ul className="space-y-1.5 ml-6">{conviction.bearCase.map((point, i) => <li key={i} className="text-sm text-foreground-muted list-disc">{point}</li>)}</ul></div>
                <div><div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-warning" /><h3 className="text-sm text-warning">Key Risks</h3></div><ul className="space-y-1.5 ml-6">{conviction.risks.map((point, i) => <li key={i} className="text-sm text-foreground-muted list-disc">{point}</li>)}</ul></div>
                <div><div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-primary" /><h3 className="text-sm text-primary">Trigger Conditions</h3></div><ul className="space-y-1.5 ml-6">{conviction.triggers.map((point, i) => <li key={i} className="text-sm text-foreground-muted list-disc">{point}</li>)}</ul></div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-subtle"><p className="text-sm text-muted-foreground"><span className="text-foreground">Timeframe:</span> {conviction.timeframe}</p></div>
            </div>
          )}

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <SectionHeader title="Content Generator" subtitle="AI-powered raid content" icon={<WandSparkles className="w-5 h-5" />} />
            <div className="space-y-3">
              <button onClick={handleGenerateContent} className="w-full p-4 rounded-lg border border-border hover:border-primary/40 bg-background-subtle transition-all text-left">
                <p className="text-sm text-foreground mb-1">Generate X Thread</p>
                <p className="text-xs text-muted-foreground">Create a sharper raid angle from current token posture</p>
              </button>
              {contentOutput.length > 0 && (
                <div className="space-y-2">
                  {contentOutput.map((entry, index) => (
                    <div key={index} className="p-4 rounded-lg bg-background-subtle border border-border">
                      <p className="text-sm text-foreground">{entry}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {swarm && (
            <div className="p-6 rounded-lg bg-card border border-card-border">
              <SectionHeader title="Swarm Behavior" icon={<Users className="w-5 h-5" />} />
              <div className="space-y-3">
                {swarm.map((behavior, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1"><span className="text-sm text-foreground">{behavior.label}</span><span className="text-sm font-mono text-foreground">{behavior.percentage}%</span></div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${behavior.percentage}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <SectionHeader title="Make Prediction" />
            <div className="space-y-3">
              <button onClick={() => handleQuickPrediction('moon')} disabled={creatingPrediction} className="w-full px-4 py-3 rounded-lg bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-all">MOON 🚀</button>
              <button onClick={() => handleQuickPrediction('sideways')} disabled={creatingPrediction} className="w-full px-4 py-3 rounded-lg bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20 transition-all">SIDEWAYS ↔️</button>
              <button onClick={() => handleQuickPrediction('dump')} disabled={creatingPrediction} className="w-full px-4 py-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all">DUMP 📉</button>
            </div>
          </div>

          {lore && (
            <div className="p-6 rounded-lg bg-card border border-card-border">
              <SectionHeader title="Lore Stream" subtitle="Recent events" />
              <div className="space-y-3">
                {lore.map(entry => (
                  <div key={entry.id} className="pb-3 border-b border-border-subtle last:border-0 last:pb-0">
                    <p className="text-xs text-muted-foreground mb-1">{new Date(entry.timestamp).toLocaleString()}</p>
                    <p className="text-sm text-foreground">{entry.content}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${entry.type === 'milestone' ? 'bg-success/10 text-success' : ''} ${entry.type === 'announcement' ? 'bg-primary/10 text-primary' : ''} ${entry.type === 'event' ? 'bg-warning/10 text-warning' : ''}`}>{entry.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
