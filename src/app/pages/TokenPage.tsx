import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Target, Users, Sparkles, WandSparkles, ExternalLink } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { formatCount, formatPercent, formatUsd } from '../lib/format';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { useApi, useMutation } from '../hooks/useApi';
import { predictionApi, raidApi, tokenApi } from '../services/api';
import type { Token } from '../types';

function narrativeForToken(token?: Token) {
  if (!token) return 'This launch has signal, but the crowd still needs a cleaner reason to stay. Watch identity strength versus raw attention.';
  if (token.narrativeSummary) return token.narrativeSummary;

  if (token.momentum === 'rising') {
    return `${token.name} is acting like a live Four.meme winner right now. Attention is still rising, holder count is broad enough to matter, and the chart has not fully broken the social loop.`;
  }

  if (token.momentum === 'falling') {
    return `${token.name} still has a visible crowd, but the signal is cooling. Sloan would treat this as a rebound watch until fresh volume proves the meme is alive again.`;
  }

  return `${token.name} is sitting in the middle lane. The community has enough surface area to matter, but it still needs a sharper catalyst to force a strong move.`;
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
  const narrative = useMemo(() => narrativeForToken(token), [token]);

  async function handleGenerateContent() {
    if (!token) return;
    const result = await generateContent({
      token: token.name,
      platform: 'X',
      vibe: token.momentum === 'rising' ? 'charged' : 'measured',
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
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Command Center
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl text-foreground">{token.name}</h1>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-mono">${token.ticker}</span>
              {token.source === 'four.meme' && (
                <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-xs">live Four.meme</span>
              )}
              {token.fourMemeStatus && (
                <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs">{token.fourMemeStatus}</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span>Market Cap: {formatUsd(token.marketCap)}</span>
              <span>Volume 24h: {formatUsd(token.volume24h)}</span>
              <span>Holders: {formatCount(token.holders, { compact: false })}</span>
              {token.lastSyncedAt && <span>Synced: {new Date(token.lastSyncedAt).toLocaleString()}</span>}
            </div>
          </div>
          {token.sourceUrl && (
            <a
              href={token.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:border-primary/40 transition-all text-sm"
            >
              Open on Four.meme
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-card border border-card-border">
            <p className="text-sm text-muted-foreground mb-1">Price</p>
            <p className="text-2xl text-foreground">{formatUsd(token.price, { compact: false })}</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-card-border">
            <p className="text-sm text-muted-foreground mb-1">24h Change</p>
            <div className={`flex items-center gap-2 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <p className="text-2xl">{formatPercent(token.priceChange24h, { showPlus: true })}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-card border border-card-border">
            <p className="text-sm text-muted-foreground mb-1">Momentum</p>
            <p className="text-2xl text-foreground capitalize">{token.momentum}</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-card-border">
            <p className="text-sm text-muted-foreground mb-1">Trade posture</p>
            <p className="text-lg text-foreground">
              {token.momentum === 'rising' ? 'Early but hot' : token.momentum === 'falling' ? 'Wait for proof' : 'Watch closely'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <SectionHeader title="Narrative Scan" subtitle="Why this token is getting attention" icon={<Sparkles className="w-5 h-5" />} />
            <p className="text-foreground-muted leading-relaxed">{narrative}</p>
          </div>

          {conviction && (
            <div className="p-6 rounded-lg bg-card border border-card-border">
              <SectionHeader title="Conviction Card" subtitle={`Score ${conviction.convictionScore}/100`} icon={<Target className="w-5 h-5" />} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <button onClick={handleGenerateContent} disabled={generatingContent} className="w-full p-4 rounded-lg border border-border hover:border-primary/40 bg-background-subtle transition-all text-left disabled:opacity-60">
                <p className="text-sm text-foreground mb-1">{generatingContent ? 'Generating X content...' : 'Generate X Thread'}</p>
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
              <button onClick={() => handleQuickPrediction('moon')} disabled={creatingPrediction} className="w-full px-4 py-3 rounded-lg bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-all disabled:opacity-60">MOON 🚀</button>
              <button onClick={() => handleQuickPrediction('sideways')} disabled={creatingPrediction} className="w-full px-4 py-3 rounded-lg bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20 transition-all disabled:opacity-60">SIDEWAYS ↔️</button>
              <button onClick={() => handleQuickPrediction('dump')} disabled={creatingPrediction} className="w-full px-4 py-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all disabled:opacity-60">DUMP 📉</button>
            </div>
          </div>

          {lore && lore.length > 0 && (
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
