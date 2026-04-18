import {
  Sparkles,
  Palette,
  Type,
  BookOpen,
  Megaphone,
  CheckCircle2,
  Copy,
  Download,
  Flag,
  Swords,
  Rocket,
  MessageSquareQuote,
  Wand2,
} from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingState } from '../components/LoadingState';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { forgeApi } from '../services/api';
import { useMutation } from '../hooks/useApi';
import type { ForgeInput, LaunchIdentity } from '../types';

const defaultIdentity: LaunchIdentity = {
  projectName: 'Sloan Demo Project',
  projectSummary: 'A hackathon-ready meme launch concept with enough identity to stand out and enough structure to feel intentional.',
  heroLine: 'Not another meme. A launch with posture.',
  memeDNA: ['AI-Native', 'Community-First', 'Viral Potential', 'Meme Culture'],
  nameOptions: ['PepeAI', 'AiDoge', 'MemeGPT', 'TokenBot', 'CryptoMind'],
  tickerOptions: ['$PEAI', '$AIDG', '$MGPT', '$TBOT', '$CMND'],
  lore: [
    'Born from the depths of the timeline, this meme chose coordination over chaos.',
    'When AI met meme culture, something sticky happened. Sloan wants to package that momentum.',
    'Not just another token. A launch with identity, posture, and a community reason to care.',
  ],
  slogans: ['Memes made smarter', 'AI-powered, community-driven', 'Where intelligence meets internet culture'],
  communityHooks: ['Give the timeline one phrase it repeats back.', 'Make the replies feel like a tribe, not random noise.', 'Reward the first people who spread the meme language.'],
  ritualIdeas: ['Run a daily cult check-in at one fixed hour.', 'Use one signature reply on every milestone post.', 'Turn every green candle into a screenshot ritual.'],
  enemyFraming: ['Against lifeless copy-paste launches.', 'Built for people tired of empty meme shells.'],
  launchCopy: ['Introducing a meme launch built for attention, conviction, and community coordination.'],
  launchChecklist: ['Lock the hero line before launch.', 'Prepare 3 posts and 5 replies.', 'Decide your first rivalry and first ritual.'],
  aestheticDirection: ['Cyber minimalist with neon signal', 'Bold mascot system', 'Terminal inspired visuals'],
};

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-subtle px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? 'Copied' : label}
    </button>
  );
}

function ArrayPanel({
  title,
  icon,
  items,
  tone = 'default',
}: {
  title: string;
  icon: ReactNode;
  items?: string[];
  tone?: 'default' | 'accent';
}) {
  const list = items?.filter(Boolean) ?? [];
  return (
    <div className="rounded-xl border border-card-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-primary">{icon}</div>
          <h3 className="text-foreground">{title}</h3>
        </div>
        {list.length > 0 ? <CopyButton value={list.join('\n')} label="Copy all" /> : null}
      </div>
      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Generate a launch pack to fill this section.
          </div>
        ) : list.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className={tone === 'accent'
              ? 'rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-4'
              : 'rounded-lg border border-border bg-background-subtle p-4'}
          >
            <p className="text-sm leading-6 text-foreground whitespace-pre-line">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LaunchForge() {
  const [formData, setFormData] = useState<ForgeInput>({
    concept: '',
    targetAudience: 'Degens',
    vibe: 'Playful',
    memeCategory: 'Cult meme',
    launchGoal: 'build a meme launch people want to post about and return to',
    enemyOrContrast: 'copy-paste launches with no identity',
    referenceStyle: 'internet war-room minimalism',
  });
  const [identity, setIdentity] = useState<LaunchIdentity>(defaultIdentity);
  const [history, setHistory] = useState<LaunchIdentity[]>([]);
  const [booting, setBooting] = useState(true);
  const [status, setStatus] = useState('');
  const { mutate, loading } = useMutation(forgeApi.generateIdentity);

  useEffect(() => {
    let mounted = true;
    Promise.all([forgeApi.getLastIdentity(), forgeApi.getHistory?.() ?? Promise.resolve([])]).then(([saved, savedHistory]) => {
      if (!mounted) return;
      if (saved) setIdentity(saved);
      if (savedHistory?.length) setHistory(savedHistory);
      setBooting(false);
    }).catch(() => {
      if (mounted) setBooting(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const exportPayload = useMemo(() => ({
    input: formData,
    identity,
    exportedAt: new Date().toISOString(),
  }), [formData, identity]);

  async function handleGenerate() {
    setStatus('');
    const result = await mutate(formData);
    if (result?.identity) {
      setIdentity(result.identity);
      setHistory((prev) => [result.identity, ...prev].slice(0, 6));
      setStatus('New identity pack generated. You can copy or export it now.');
    }
  }

  function exportPack() {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(identity.projectName || 'sloan-launch-pack').replace(/\s+/g, '-').toLowerCase()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Launch pack exported as JSON.');
  }

  if (booting) {
    return <LoadingState message="Loading Forge..." />;
  }

  return (
    <div className="space-y-8 p-8">
      <SectionHeader
        title="Launch Forge"
        subtitle="Generate the identity, meme language, and launch pack that makes a Four.meme launch feel alive."
        icon={<Sparkles className="h-5 w-5" />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg text-foreground">Forge brief</h3>
                <p className="mt-1 text-sm text-muted-foreground">Feed the AI enough direction so the output sounds like a real launch, not generic slop.</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
                AI structured output
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-muted-foreground">Project concept</label>
                <textarea
                  value={formData.concept}
                  onChange={(event) => setFormData((prev) => ({ ...prev, concept: event.target.value }))}
                  placeholder="Describe the meme idea, the joke, the social angle, and why people would care..."
                  className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  rows={5}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Target audience</label>
                <select value={formData.targetAudience} onChange={(event) => setFormData((prev) => ({ ...prev, targetAudience: event.target.value }))} className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:border-primary focus:outline-none">
                  <option>Degens</option>
                  <option>AI Enthusiasts</option>
                  <option>Meme Lords</option>
                  <option>Crypto Natives</option>
                  <option>Normie internet crowd</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Vibe</label>
                <select value={formData.vibe} onChange={(event) => setFormData((prev) => ({ ...prev, vibe: event.target.value }))} className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:border-primary focus:outline-none">
                  <option>Playful</option>
                  <option>Chaotic</option>
                  <option>Menacing</option>
                  <option>Professional</option>
                  <option>Absurdist</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Meme category</label>
                <input
                  value={formData.memeCategory ?? ''}
                  onChange={(event) => setFormData((prev) => ({ ...prev, memeCategory: event.target.value }))}
                  placeholder="Cult meme, satire, AI irony, mascot war..."
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Launch goal</label>
                <input
                  value={formData.launchGoal ?? ''}
                  onChange={(event) => setFormData((prev) => ({ ...prev, launchGoal: event.target.value }))}
                  placeholder="Own the feed, win first-day attention, survive day two..."
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Enemy or contrast</label>
                <input
                  value={formData.enemyOrContrast ?? ''}
                  onChange={(event) => setFormData((prev) => ({ ...prev, enemyOrContrast: event.target.value }))}
                  placeholder="What are you against?"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-muted-foreground">Reference style</label>
                <input
                  value={formData.referenceStyle ?? ''}
                  onChange={(event) => setFormData((prev) => ({ ...prev, referenceStyle: event.target.value }))}
                  placeholder="Terminal minimalism, cyber shrine, loud satire poster..."
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={handleGenerate} disabled={loading || !formData.concept.trim()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70">
                <Wand2 className="h-4 w-4" />
                {loading ? 'Generating identity pack...' : 'Generate launch pack'}
              </button>
              <button type="button" onClick={exportPack} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-subtle px-5 py-3 text-sm text-foreground transition hover:border-primary/40">
                <Download className="h-4 w-4" />
                Export JSON
              </button>
              <CopyButton value={JSON.stringify(exportPayload, null, 2)} label="Copy JSON" />
            </div>
            {status ? <p className="mt-4 text-sm text-primary">{status}</p> : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-card p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Project identity</p>
                  <h3 className="mt-2 text-2xl text-foreground">{identity.projectName}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{identity.projectSummary ?? 'Generate a pack to get a sharper launch summary.'}</p>
                </div>
                <CopyButton value={`${identity.projectName}\n\n${identity.projectSummary ?? ''}\n\n${identity.heroLine ?? ''}`} label="Copy brief" />
              </div>
              <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-primary">Hero line</p>
                <p className="mt-3 text-lg leading-7 text-foreground">{identity.heroLine ?? 'Generate a hero line that gives the launch a point of view.'}</p>
              </div>
            </div>

            <ArrayPanel title="Name options" icon={<Type className="h-5 w-5" />} items={identity.nameOptions} />
            <ArrayPanel title="Ticker options" icon={<Flag className="h-5 w-5" />} items={identity.tickerOptions} />
            <ArrayPanel title="Meme DNA" icon={<Sparkles className="h-5 w-5" />} items={identity.memeDNA} />
            <ArrayPanel title="Community slogans" icon={<MessageSquareQuote className="h-5 w-5" />} items={identity.slogans} />
            <ArrayPanel title="Lore pack" icon={<BookOpen className="h-5 w-5" />} items={identity.lore} />
            <ArrayPanel title="Community hooks" icon={<Rocket className="h-5 w-5" />} items={identity.communityHooks} />
            <ArrayPanel title="Ritual ideas" icon={<CheckCircle2 className="h-5 w-5" />} items={identity.ritualIdeas} />
            <ArrayPanel title="Enemy framing" icon={<Swords className="h-5 w-5" />} items={identity.enemyFraming} />
            <ArrayPanel title="Launch copy pack" icon={<Megaphone className="h-5 w-5" />} items={identity.launchCopy} />
            <ArrayPanel title="Launch checklist" icon={<CheckCircle2 className="h-5 w-5" />} items={identity.launchChecklist} />
            <ArrayPanel title="Aesthetic direction" icon={<Palette className="h-5 w-5" />} items={identity.aestheticDirection} tone="accent" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-primary/30 bg-card p-6">
            <h3 className="text-foreground">Launch readiness</h3>
            <div className="mt-4 space-y-3">
              {[
                ['Concept', Boolean(formData.concept.trim())],
                ['Hero line', Boolean(identity.heroLine)],
                ['Name and ticker set', Boolean(identity.nameOptions?.length && identity.tickerOptions?.length)],
                ['Community language', Boolean(identity.slogans?.length && identity.communityHooks?.length)],
                ['Go-to-market copy', Boolean(identity.launchCopy?.length)],
                ['Visual direction', Boolean(identity.aestheticDirection?.length)],
              ].map(([label, ok]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-background-subtle px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={ok ? 'text-green-400' : 'text-amber-400'}>{ok ? 'Ready' : 'Needs work'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-foreground">Recent Forge outputs</h3>
              <span className="text-xs text-muted-foreground">Latest 6</span>
            </div>
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Your recent launch packs will show here after generation.
                </div>
              ) : history.map((item, index) => (
                <button
                  key={`${item.projectName}-${index}`}
                  type="button"
                  onClick={() => setIdentity(item)}
                  className="w-full rounded-lg border border-border bg-background-subtle p-4 text-left transition hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-foreground">{item.projectName}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.heroLine ?? item.projectSummary ?? item.launchCopy?.[0]}</p>
                    </div>
                    <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">Load</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6">
            <h3 className="text-foreground">How to use the pack</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Use the hero line and project summary for your launch page and first post.</p>
              <p>Use the slogans, hooks, and rituals to keep the timeline language consistent.</p>
              <p>Use the enemy framing to make the launch feel distinct instead of generic.</p>
              <p>Use the checklist before you publish anything so the launch lands as one coordinated drop.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
