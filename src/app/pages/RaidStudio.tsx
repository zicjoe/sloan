import { Radio, BarChart3, Link2, WandSparkles, Copy, Megaphone, MessageSquareQuote, Target, Siren, ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingState } from '../components/LoadingState';
import { useApi, useMutation } from '../hooks/useApi';
import { raidApi, tokenApi } from '../services/api';
import { writeStorage, readStorage } from '../lib/persistence';
import type { GeneratedRaidContent, Token } from '../types';

const STORAGE_KEY = 'sloan.raids.generated';

function copyText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(value).catch(() => undefined);
  }
}

function listToText(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function getSuggestedCTA(token?: Token) {
  if (!token) return 'Push the story while attention is still cheap.';
  if (token.momentum === 'rising') return `Push ${token.ticker} before the crowd catches up.`;
  if (token.momentum === 'falling') return `Reframe ${token.ticker} before the feed fully rotates away.`;
  return `Make ${token.ticker} impossible to scroll past.`;
}

export function RaidStudio() {
  const [form, setForm] = useState({
    token: '',
    platform: 'X',
    vibe: 'Sharp',
    objective: 'win timeline mindshare',
    audience: 'Degens',
    contrast: 'copy-paste launches with no real identity',
    callToAction: '',
  });
  const [generated, setGenerated] = useState<GeneratedRaidContent | null>(() => readStorage<GeneratedRaidContent | null>(STORAGE_KEY, null));
  const [history, setHistory] = useState<GeneratedRaidContent[]>([]);
  const { data: campaigns, loading: campaignsLoading } = useApi(raidApi.getCampaigns);
  const { data: contentVariants, loading: contentLoading } = useApi(raidApi.getContentVariants);
  const { data: replyLines, loading: repliesLoading } = useApi(raidApi.getReplyLines);
  const { data: tokens } = useApi(tokenApi.getAll);
  const { mutate, loading: generating } = useMutation(raidApi.generateContent);

  const loading = campaignsLoading || contentLoading || repliesLoading;
  const selectedToken = useMemo(() => (tokens || []).find(token => token.name === form.token), [tokens, form.token]);

  useEffect(() => {
    if (!form.token && (tokens || []).length > 0) {
      const token = tokens?.[0];
      setForm(prev => ({
        ...prev,
        token: token?.name || '',
        callToAction: getSuggestedCTA(token),
      }));
    }
  }, [tokens, form.token]);

  useEffect(() => {
    if (selectedToken && !form.callToAction) {
      setForm(prev => ({ ...prev, callToAction: getSuggestedCTA(selectedToken) }));
    }
  }, [selectedToken, form.callToAction]);
  useEffect(() => {
    let mounted = true;
    Promise.all([raidApi.getLastGenerated?.() ?? Promise.resolve(null), raidApi.getHistory?.() ?? Promise.resolve([])]).then(([saved, savedHistory]) => {
      if (!mounted) return;
      if (saved) setGenerated(saved);
      if (savedHistory?.length) setHistory(savedHistory);
    }).catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const totalEngagement = (campaigns || []).reduce((sum, campaign) => sum + campaign.engagement, 0);
  const totalPosts = (campaigns || []).reduce((sum, campaign) => sum + campaign.postsGenerated, 0);
  const totalParticipants = (campaigns || []).reduce((sum, campaign) => sum + campaign.participants, 0);
  const engagementRate = totalPosts > 0 ? Math.min(100, Math.round((totalEngagement / Math.max(totalPosts, 1)) / 10)) : 0;
  const participantRate = totalParticipants > 0 ? Math.min(100, Math.round((totalParticipants / Math.max((campaigns || []).length, 1)) / 2)) : 0;
  const trackedLinks = useMemo(() => {
    const slug = selectedToken?.slug || form.token.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return [
      { label: 'X campaign', url: `sloan.link/${slug}-x`, clicks: Math.max(120, totalEngagement) },
      { label: 'Watchlist route', url: `sloan.link/${slug}-watch`, clicks: Math.max(80, Math.round(totalParticipants * 4)) },
      { label: 'Reply swarm', url: `sloan.link/${slug}-replies`, clicks: Math.max(40, Math.round(totalPosts / 3)) },
    ];
  }, [selectedToken, form.token, totalEngagement, totalParticipants, totalPosts]);

  async function handleGenerate() {
    const result = await mutate({
      ...form,
      tokenTicker: selectedToken?.ticker,
      tokenSlug: selectedToken?.slug,
      narrativeSummary: selectedToken?.narrativeSummary,
      momentum: selectedToken?.momentum,
      volume24h: selectedToken?.volume24h,
      holders: selectedToken?.holders,
      priceChange24h: selectedToken?.priceChange24h,
      sourceRankLabel: selectedToken?.sourceRankLabel,
    });
    if (result?.content) {
      setGenerated(result.content);
      setHistory((prev) => [result.content, ...prev.filter((item) => item.missionBrief !== result.content.missionBrief)].slice(0, 6));
      writeStorage(STORAGE_KEY, result.content);
    }
  }

  if (loading) {
    return <LoadingState message="Loading raid studio..." />;
  }

  return (
    <div className="p-8 space-y-8">
      <SectionHeader title="Raid Studio" subtitle="Turn meme attention into a coordinated posting mission that actually sounds human." icon={<Radio className="w-5 h-5" />} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><WandSparkles className="w-5 h-5 text-primary" /><h3 className="text-foreground">Generate Raid Pack</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Token</label>
                <select value={form.token} onChange={(event) => setForm(prev => ({ ...prev, token: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                  {(tokens || []).map(token => <option key={token.id} value={token.name}>{token.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Platform</label>
                <select value={form.platform} onChange={(event) => setForm(prev => ({ ...prev, platform: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                  <option>X</option>
                  <option>Telegram</option>
                  <option>Discord</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Vibe</label>
                <select value={form.vibe} onChange={(event) => setForm(prev => ({ ...prev, vibe: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                  <option>Sharp</option>
                  <option>Playful</option>
                  <option>Contrarian</option>
                  <option>Smug</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Objective</label>
                <select value={form.objective} onChange={(event) => setForm(prev => ({ ...prev, objective: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                  <option>win timeline mindshare</option>
                  <option>drive replies</option>
                  <option>boost watchlist adds</option>
                  <option>make the launch impossible to ignore</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Target audience</label>
                <select value={form.audience} onChange={(event) => setForm(prev => ({ ...prev, audience: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                  <option>Degens</option>
                  <option>Reply guys</option>
                  <option>Trend hunters</option>
                  <option>Community lurkers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Contrast or enemy</label>
                <input value={form.contrast} onChange={(event) => setForm(prev => ({ ...prev, contrast: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none" placeholder="copy-paste launches with no identity" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-2">Call to action</label>
              <input value={form.callToAction} onChange={(event) => setForm(prev => ({ ...prev, callToAction: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none" placeholder="Push the story while attention is still cheap." />
            </div>
            {selectedToken ? (
              <div className="mb-4 p-4 rounded-lg bg-background-subtle border border-border text-sm text-muted-foreground space-y-1">
                <p><span className="text-foreground">Live token context:</span> {selectedToken.name} {selectedToken.ticker} • {selectedToken.momentum} momentum</p>
                <p>{selectedToken.narrativeSummary || 'No narrative summary yet. Raid Studio will lean on live metrics and your brief.'}</p>
              </div>
            ) : null}
            <button onClick={handleGenerate} disabled={generating} className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70">
              {generating ? 'Generating raid pack...' : 'Generate Raid Pack'}
            </button>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /><h3 className="text-foreground">Mission brief</h3></div>
              {generated?.missionBrief ? <button onClick={() => copyText(generated.missionBrief)} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><Copy className="w-4 h-4" />Copy brief</button> : null}
            </div>
            <div className="p-4 rounded-lg bg-background-subtle border border-border text-sm text-foreground leading-6">
              {generated?.missionBrief || 'Generate a raid pack to see the mission brief, posting angle, and guardrails here.'}
            </div>
            {generated?.callToAction ? (
              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Call to action</p>
                  <p className="text-foreground">{generated.callToAction}</p>
                </div>
                <button onClick={() => copyText(generated.callToAction)} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><Copy className="w-4 h-4" />Copy</button>
              </div>
            ) : null}
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /><h3 className="text-foreground">Content variants</h3></div>
              <button onClick={() => copyText(listToText(generated?.variants || []))} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><Copy className="w-4 h-4" />Copy all</button>
            </div>
            <div className="space-y-4">
              {(generated ? [{ platform: generated.platform, variants: generated.variants }] : contentVariants || []).map((platformBlock, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm text-primary">{platformBlock.platform}</p>
                  {platformBlock.variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="p-4 rounded-lg bg-background-subtle border border-border flex items-start justify-between gap-3">
                      <p className="text-sm text-foreground leading-6">{variant}</p>
                      <button onClick={() => copyText(variant)} className="shrink-0 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><Copy className="w-3 h-3" />Copy</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg bg-card border border-card-border">
              <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><MessageSquareQuote className="w-5 h-5 text-primary" /><h3 className="text-foreground">Reply ammo</h3></div><button onClick={() => copyText(listToText(generated?.replyLines || []))} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><Copy className="w-4 h-4" />Copy all</button></div>
              <div className="space-y-2">
                {(generated?.replyLines || replyLines || []).map((line, index) => (
                  <div key={index} className="p-3 rounded-lg bg-background-subtle border border-border flex items-start justify-between gap-3">
                    <p className="text-sm text-foreground">{line}</p>
                    <button onClick={() => copyText(line)} className="shrink-0 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><Copy className="w-3 h-3" />Copy</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card border border-card-border">
              <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><MessageSquareQuote className="w-5 h-5 text-primary" /><h3 className="text-foreground">Quote replies</h3></div><button onClick={() => copyText(listToText(generated?.quoteReplies || []))} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><Copy className="w-4 h-4" />Copy all</button></div>
              <div className="space-y-2">
                {(generated?.quoteReplies || []).map((line, index) => (
                  <div key={index} className="p-3 rounded-lg bg-background-subtle border border-border flex items-start justify-between gap-3">
                    <p className="text-sm text-foreground">{line}</p>
                    <button onClick={() => copyText(line)} className="shrink-0 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><Copy className="w-3 h-3" />Copy</button>
                  </div>
                ))}
                {!generated?.quoteReplies?.length ? <p className="text-sm text-muted-foreground">Generate a raid pack to get quote reply lines.</p> : null}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /><h3 className="text-foreground">Recent raid packs</h3></div><span className="text-xs text-muted-foreground">Latest 6</span></div>
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Your recent raid packs will show here after generation.
                </div>
              ) : history.map((item, index) => (
                <button key={`${item.platform}-${index}-${item.missionBrief.slice(0, 18)}`} type="button" onClick={() => setGenerated(item)} className="w-full rounded-lg border border-border bg-background-subtle p-4 text-left transition hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-foreground">{item.platform} raid pack</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.missionBrief}</p>
                    </div>
                    <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">Load</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Active Campaigns</h3>
            <div className="space-y-3">
              {(campaigns || []).map(campaign => (
                <div key={campaign.id} className="p-4 rounded-lg bg-background-subtle border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-foreground">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.participants} participants</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${campaign.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{campaign.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg border border-border">Posts: <span className="font-mono text-foreground">{campaign.postsGenerated}</span></div>
                    <div className="p-3 rounded-lg border border-border">Engagement: <span className="font-mono text-foreground">{campaign.engagement.toLocaleString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-primary" /><h3 className="text-foreground">Performance Metrics</h3></div>
            <div className="space-y-4">
              <div><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Engagement pressure</span><span className="text-sm font-mono text-foreground">{engagementRate}%</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-success" style={{ width: `${engagementRate}%` }} /></div></div>
              <div><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Participant density</span><span className="text-sm font-mono text-foreground">{participantRate}%</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-warning" style={{ width: `${participantRate}%` }} /></div></div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-primary" /><h3 className="text-foreground">Raid angles</h3></div>
            <div className="space-y-2">
              {(generated?.raidAngles || []).map((angle, index) => <div key={index} className="p-3 rounded-lg bg-background-subtle border border-border text-sm text-foreground">{angle}</div>)}
              {!generated?.raidAngles?.length ? <p className="text-sm text-muted-foreground">Generate a raid pack to get stronger posting angles.</p> : null}
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><Siren className="w-5 h-5 text-primary" /><h3 className="text-foreground">Do not say</h3></div>
            <div className="space-y-2">
              {(generated?.doNotSay || []).map((line, index) => <div key={index} className="p-3 rounded-lg bg-background-subtle border border-border text-sm text-foreground">{line}</div>)}
              {!generated?.doNotSay?.length ? <p className="text-sm text-muted-foreground">Generate a raid pack to see the anti-slop guardrails.</p> : null}
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><Link2 className="w-5 h-5 text-primary" /><h3 className="text-foreground">Tracked Links</h3></div>
            <div className="space-y-2">
              {trackedLinks.map((link) => <div key={link.url} className="p-3 rounded-lg bg-background-subtle border border-border"><p className="text-xs text-muted-foreground mb-1">{link.label}</p><p className="text-sm text-primary font-mono break-all">{link.url}</p><p className="text-xs text-muted-foreground mt-1">{link.clicks.toLocaleString()} clicks</p></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
