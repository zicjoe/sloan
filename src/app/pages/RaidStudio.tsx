import { Radio, BarChart3, Link2, WandSparkles } from 'lucide-react';
import { useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingState } from '../components/LoadingState';
import { useApi, useMutation } from '../hooks/useApi';
import { raidApi, tokenApi } from '../services/api';
import type { GeneratedRaidContent } from '../types';

export function RaidStudio() {
  const [form, setForm] = useState({ token: 'PepeAI', platform: 'X', vibe: 'Aggressive', objective: 'push attention' });
  const [generated, setGenerated] = useState<GeneratedRaidContent | null>(null);
  const { data: campaigns, loading: campaignsLoading } = useApi(raidApi.getCampaigns);
  const { data: contentVariants, loading: contentLoading } = useApi(raidApi.getContentVariants);
  const { data: replyLines, loading: repliesLoading } = useApi(raidApi.getReplyLines);
  const { data: tokens } = useApi(tokenApi.getAll);
  const { mutate, loading: generating } = useMutation(raidApi.generateContent);

  const loading = campaignsLoading || contentLoading || repliesLoading;

  async function handleGenerate() {
    const result = await mutate(form);
    if (result?.content) {
      setGenerated(result.content);
    }
  }

  if (loading) {
    return <LoadingState message="Loading raid studio..." />;
  }

  return (
    <div className="p-8 space-y-8">
      <SectionHeader title="Raid Studio" subtitle="Turn meme energy into coordinated distribution" icon={<Radio className="w-5 h-5" />} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><WandSparkles className="w-5 h-5 text-primary" /><h3 className="text-foreground">Generate Raid Content</h3></div>
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
                  <option>Aggressive</option>
                  <option>Playful</option>
                  <option>Smart</option>
                  <option>Contrarian</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Objective</label>
                <select value={form.objective} onChange={(event) => setForm(prev => ({ ...prev, objective: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                  <option>push attention</option>
                  <option>drive replies</option>
                  <option>boost watchlist adds</option>
                  <option>win timeline mindshare</option>
                </select>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={generating} className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70">
              {generating ? 'Generating raid pack...' : 'Generate Raid Pack'}
            </button>
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

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Content Variants</h3>
            <div className="space-y-4">
              {(generated ? [{ platform: generated.platform, variants: generated.variants }] : contentVariants || []).map((platformBlock, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm text-primary">{platformBlock.platform}</p>
                  {platformBlock.variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="p-4 rounded-lg bg-background-subtle border border-border">
                      <p className="text-sm text-foreground">{variant}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-primary" /><h3 className="text-foreground">Performance Metrics</h3></div>
            <div className="space-y-4">
              <div><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Engagement</span><span className="text-sm font-mono text-foreground">12.4%</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-success" style={{ width: '62%' }} /></div></div>
              <div><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Conversion</span><span className="text-sm font-mono text-foreground">3.8%</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-warning" style={{ width: '38%' }} /></div></div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><Link2 className="w-5 h-5 text-primary" /><h3 className="text-foreground">Tracked Links</h3></div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-background-subtle border border-border"><p className="text-xs text-muted-foreground mb-1">Twitter Campaign</p><p className="text-sm text-primary font-mono break-all">sloan.link/pepeai-tw</p><p className="text-xs text-muted-foreground mt-1">1,234 clicks</p></div>
              <div className="p-3 rounded-lg bg-background-subtle border border-border"><p className="text-xs text-muted-foreground mb-1">Telegram Invite</p><p className="text-sm text-primary font-mono break-all">sloan.link/pepeai-tg</p><p className="text-xs text-muted-foreground mt-1">892 clicks</p></div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Reply Ammo</h3>
            <div className="space-y-2">
              {(generated?.replyLines || replyLines || []).map((line, index) => (
                <div key={index} className="p-3 rounded-lg bg-background-subtle border border-border">
                  <p className="text-sm text-foreground">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
