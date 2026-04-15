import { Sparkles, Palette, Type, BookOpen, Megaphone, CheckCircle2 } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingState } from '../components/LoadingState';
import { useEffect, useState } from 'react';
import { forgeApi } from '../services/api';
import { useMutation } from '../hooks/useApi';
import type { ForgeInput, LaunchIdentity } from '../types';

const defaultIdentity: LaunchIdentity = {
  projectName: 'Sloan Demo Project',
  memeDNA: ['AI-Native', 'Community-First', 'Viral Potential', 'Meme Culture'],
  nameOptions: ['PepeAI', 'AiDoge', 'MemeGPT', 'TokenBot', 'CryptoMind'],
  tickerOptions: ['$PEAI', '$AIDG', '$MGPT', '$TBOT', '$CMND'],
  lore: [
    'Born from the depths of the timeline, this meme chose coordination over chaos.',
    'When AI met meme culture, something sticky happened. Sloan wants to package that momentum.',
    'Not just another token. A launch with identity, posture, and a community reason to care.',
  ],
  slogans: ['Memes made smarter', 'AI-powered, community-driven', 'Where intelligence meets internet culture'],
  launchCopy: ['Introducing a meme launch built for attention, conviction, and community coordination.'],
  aestheticDirection: ['Cyber minimalist with neon signal', 'Bold mascot system', 'Terminal inspired visuals'],
};

export function LaunchForge() {
  const [formData, setFormData] = useState<ForgeInput>({
    concept: '',
    targetAudience: 'Degens',
    vibe: 'Playful',
  });
  const [identity, setIdentity] = useState<LaunchIdentity>(defaultIdentity);
  const [booting, setBooting] = useState(true);
  const { mutate, loading } = useMutation(forgeApi.generateIdentity);

  useEffect(() => {
    let mounted = true;
    forgeApi.getLastIdentity().then((saved) => {
      if (mounted && saved) setIdentity(saved);
      if (mounted) setBooting(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleGenerate() {
    const result = await mutate(formData);
    if (result?.identity) {
      setIdentity(result.identity);
    }
  }

  if (booting) {
    return <LoadingState message="Loading Forge..." />;
  }

  return (
    <div className="p-8 space-y-8">
      <SectionHeader title="Launch Forge" subtitle="Build your meme token identity with AI" icon={<Sparkles className="w-5 h-5" />} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Project Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Project Concept</label>
                <textarea
                  value={formData.concept}
                  onChange={(event) => setFormData(prev => ({ ...prev, concept: event.target.value }))}
                  placeholder="Describe your meme token idea..."
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Target Audience</label>
                  <select value={formData.targetAudience} onChange={(event) => setFormData(prev => ({ ...prev, targetAudience: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                    <option>Degens</option>
                    <option>AI Enthusiasts</option>
                    <option>Meme Lords</option>
                    <option>Crypto Natives</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Vibe</label>
                  <select value={formData.vibe} onChange={(event) => setFormData(prev => ({ ...prev, vibe: event.target.value }))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none">
                    <option>Playful</option>
                    <option>Serious</option>
                    <option>Chaotic</option>
                    <option>Professional</option>
                  </select>
                </div>
              </div>
              <button onClick={handleGenerate} disabled={loading} className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70">
                {loading ? 'Generating Identity Pack...' : 'Generate Identity Pack'}
              </button>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><Type className="w-5 h-5 text-primary" /><h3 className="text-foreground">Name & Ticker Options</h3></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Name Ideas</p>
                <div className="space-y-2">{identity.nameOptions.map((name, index) => <div key={index} className="w-full px-4 py-2 rounded-lg border border-border bg-background-subtle text-left text-foreground">{name}</div>)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ticker Ideas</p>
                <div className="space-y-2">{identity.tickerOptions.map((ticker, index) => <div key={index} className="w-full px-4 py-2 rounded-lg border border-border bg-background-subtle text-left text-foreground font-mono">{ticker}</div>)}</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-primary" /><h3 className="text-foreground">Lore Pack</h3></div>
            <div className="space-y-3">{identity.lore.map((lore, index) => <div key={index} className="p-4 rounded-lg bg-background-subtle border border-border"><p className="text-foreground italic">{lore}</p></div>)}</div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><Megaphone className="w-5 h-5 text-primary" /><h3 className="text-foreground">Launch Copy Pack</h3></div>
            <div className="space-y-4">{identity.launchCopy.map((copy, index) => <div key={index} className="p-4 rounded-lg bg-background-subtle border border-border"><p className="text-foreground whitespace-pre-line">{copy}</p></div>)}</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-primary" /><h3 className="text-foreground">Meme DNA</h3></div>
            <div className="space-y-2">{identity.memeDNA.map((trait, index) => <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-dim"><CheckCircle2 className="w-4 h-4 text-primary" /><span className="text-sm text-foreground">{trait}</span></div>)}</div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Community Slogans</h3>
            <div className="space-y-2">{identity.slogans.map((slogan, index) => <div key={index} className="p-3 rounded-lg bg-background-subtle border border-border"><p className="text-sm text-foreground text-center">{slogan}</p></div>)}</div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4"><Palette className="w-5 h-5 text-primary" /><h3 className="text-foreground">Aesthetic Direction</h3></div>
            <div className="space-y-3">{identity.aestheticDirection.map((direction, index) => <div key={index} className="p-4 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20"><p className="text-sm text-foreground">{direction}</p></div>)}</div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-primary/40">
            <h3 className="text-foreground mb-4">Launch Readiness</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Identity</span><span className="text-sm text-success">✓ Complete</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Branding</span><span className="text-sm text-success">✓ Complete</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Launch Copy</span><span className="text-sm text-success">✓ Complete</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Community Hooks</span><span className="text-sm text-warning">Ready to test</span></div>
            </div>
            <button className="w-full mt-4 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all">Export Launch Pack</button>
          </div>
        </div>
      </div>
    </div>
  );
}
