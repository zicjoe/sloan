import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, BrainCircuit, CheckCircle2, Sparkles, Swords, Wand2 } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { useApi, useMutation } from '../hooks/useApi';
import { questApi, tokenApi } from '../services/api';
import type { Quest, QuestForgeInput, QuestSuggestionPack } from '../types';

const categoryOptions: Quest['category'][] = ['posting', 'prediction', 'meme', 'rivalry', 'recovery'];
const proofOptions: NonNullable<Quest['proofType']>[] = ['link', 'prediction', 'image', 'text'];
const difficultyOptions: NonNullable<Quest['difficulty']>[] = ['easy', 'medium', 'hard'];

function mapQuestToForgeInput(quest: Quest): QuestForgeInput {
  return {
    tokenSlug: quest.tokenSlug || '',
    category: quest.category,
    title: quest.title,
    description: quest.description,
    reward: quest.reward,
    difficulty: quest.difficulty || 'medium',
    proofType: quest.proofType || 'text',
    missionBrief: quest.missionBrief || '',
    submissionRule: quest.submissionRule || '',
    exampleProof: quest.exampleProof || '',
    deadline: quest.deadline,
    ownerNote: quest.ownerNote,
    aiSuggested: quest.aiSuggested,
  };
}

export function QuestForgePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const presetTokenSlug = searchParams.get('token') || '';
  const presetCategory = searchParams.get('category') as Quest['category'] | null;
  const [selectedTokenSlug, setSelectedTokenSlug] = useState(presetTokenSlug);
  const [selectedCategory, setSelectedCategory] = useState<Quest['category']>(presetCategory || 'posting');
  const [strategyNote, setStrategyNote] = useState('');
  const [suggestions, setSuggestions] = useState<Quest[]>([]);
  const [status, setStatus] = useState('');
  const [publishedQuest, setPublishedQuest] = useState<Quest | null>(null);
  const [form, setForm] = useState<QuestForgeInput>({
    tokenSlug: presetTokenSlug,
    category: presetCategory || 'posting',
    title: '',
    description: '',
    reward: 240,
    difficulty: 'medium',
    proofType: 'link',
    missionBrief: '',
    submissionRule: '',
    exampleProof: '',
    ownerNote: '',
    aiSuggested: false,
  });

  const { data: tokens, loading: tokensLoading } = useApi(tokenApi.getAll);
  const { mutate: suggestMutate, loading: suggesting } = useMutation(questApi.getForgeSuggestions);
  const { mutate: publishMutate, loading: publishing, error: publishError } = useMutation(questApi.publishQuest);

  useEffect(() => {
    if (!selectedTokenSlug && tokens?.length) {
      const first = tokens[0];
      setSelectedTokenSlug(first.slug);
      setForm((prev) => ({ ...prev, tokenSlug: first.slug }));
    }
  }, [tokens, selectedTokenSlug]);

  useEffect(() => {
    if (selectedTokenSlug) {
      setForm((prev) => ({ ...prev, tokenSlug: selectedTokenSlug }));
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('token', selectedTokenSlug);
        next.set('category', selectedCategory);
        return next;
      });
    }
  }, [selectedTokenSlug, selectedCategory, setSearchParams]);

  const selectedToken = useMemo(() => tokens?.find((token) => token.slug === selectedTokenSlug), [tokens, selectedTokenSlug]);

  async function handleSuggest() {
    setStatus('');
    const pack = await suggestMutate({ tokenSlug: selectedTokenSlug, category: selectedCategory }) as QuestSuggestionPack | null;
    if (!pack) return;
    setStrategyNote(pack.strategyNote);
    setSuggestions(pack.suggestions);
    const next = pack.suggestions[0];
    if (next) setForm(mapQuestToForgeInput(next));
    setStatus('Sloan suggested owner-led quests. Pick one and edit it before publishing.');
  }

  function applySuggestion(quest: Quest) {
    setForm(mapQuestToForgeInput(quest));
    setSelectedCategory(quest.category);
    setStatus('Suggestion loaded into the editor. Tighten it and publish when ready.');
  }

  async function handlePublish() {
    setStatus('');
    const published = await publishMutate({ ...form, tokenSlug: selectedTokenSlug, category: selectedCategory }) as Quest | null;
    if (!published) {
      setStatus('Publish failed. Check that the quest write policy patch was run in Supabase, then try again.');
      return;
    }
    setPublishedQuest(published);
    setStatus('Quest published. It should now show up in Quest Arena for the community.');
  }

  if (tokensLoading) return <LoadingState message="Loading Quest Forge..." />;

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader
          title="Quest Forge"
          subtitle="Token owners or operators create the mission. Sloan AI suggests the best quest angles, then you publish the one the community should run."
          icon={<Wand2 className="w-5 h-5" />}
        />
        <Link to="/dashboard/quests" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40">
          <ArrowLeft className="w-4 h-4" />
          Back to Quest Arena
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 space-y-4">
            <div>
              <h3 className="text-lg text-foreground">Owner mission brief</h3>
              <p className="text-sm text-muted-foreground mt-1">Choose the token, choose the mission type, then let Sloan suggest quests grounded in the live state.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Token</label>
                <select value={selectedTokenSlug} onChange={(event) => setSelectedTokenSlug(event.target.value)} className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:border-primary focus:outline-none">
                  {tokens?.map((token) => (
                    <option key={token.slug} value={token.slug}>{token.name} ({token.ticker})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Quest type</label>
                <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value as Quest['category'])} className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:border-primary focus:outline-none">
                  {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
              <div className="flex items-center gap-2 text-primary mb-2"><BrainCircuit className="w-4 h-4" /> Sloan AI strategy</div>
              <p className="text-muted-foreground">{strategyNote || (selectedToken ? `${selectedToken.name} is live with ${Math.round(selectedToken.volume24h || 0).toLocaleString()} 24h volume and ${selectedToken.holders || 0} holders. Ask Sloan to turn that state into a mission the community can actually execute.` : 'Pick a token to generate a mission strategy note.')}</p>
            </div>
            <button type="button" onClick={handleSuggest} disabled={!selectedTokenSlug || suggesting} className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary transition hover:bg-primary/15 disabled:opacity-60">
              <Sparkles className="w-4 h-4" />
              {suggesting ? 'Generating suggestions...' : 'Suggest quests with AI'}
            </button>
          </div>

          <div className="rounded-xl border border-card-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg text-foreground">Suggested quests</h3>
                <p className="text-sm text-muted-foreground">Pick one, then edit the draft before you publish it live.</p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary">owner-led missions</span>
            </div>
            {suggestions.length === 0 ? (
              <EmptyState icon={<Swords className="w-6 h-6" />} title="No suggestions yet" description="Click ‘Suggest quests with AI’ to generate owner-led mission ideas from the live token state." />
            ) : (
              <div className="space-y-3">
                {suggestions.map((quest) => (
                  <button key={quest.id} type="button" onClick={() => applySuggestion(quest)} className="w-full rounded-lg border border-border bg-background-subtle p-4 text-left transition hover:border-primary/40">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <h4 className="text-foreground">{quest.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
                      </div>
                      <span className="text-xs rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-primary">{quest.reward} XP</span>
                    </div>
                    <p className="text-sm text-foreground-muted">{quest.missionBrief}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg text-foreground">Publish quest</h3>
              <p className="text-sm text-muted-foreground">This is the mission the community will actually see inside Quest Arena.</p>
            </div>
            {publishedQuest ? <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs text-success"><CheckCircle2 className="w-3.5 h-3.5" /> Published</span> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-muted-foreground">Quest title</label>
              <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="Push the one-tab engineer story" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-muted-foreground">Quest description</label>
              <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={3} className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="What the mission is in one clean sentence" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Reward XP</label>
              <input type="number" min={120} step={20} value={form.reward} onChange={(event) => setForm((prev) => ({ ...prev, reward: Number(event.target.value) || 0 }))} className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Difficulty</label>
              <select value={form.difficulty} onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value as NonNullable<Quest['difficulty']> }))} className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:border-primary focus:outline-none">
                {difficultyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Proof type</label>
              <select value={form.proofType} onChange={(event) => setForm((prev) => ({ ...prev, proofType: event.target.value as NonNullable<Quest['proofType']> }))} className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:border-primary focus:outline-none">
                {proofOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Deadline</label>
              <input type="datetime-local" value={form.deadline ? form.deadline.slice(0, 16) : ''} onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value ? new Date(event.target.value).toISOString() : undefined }))} className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-muted-foreground">Mission brief</label>
              <textarea value={form.missionBrief} onChange={(event) => setForm((prev) => ({ ...prev, missionBrief: event.target.value }))} rows={4} className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="Why this mission exists and what kind of participation you want." />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-muted-foreground">Submission rule</label>
              <textarea value={form.submissionRule} onChange={(event) => setForm((prev) => ({ ...prev, submissionRule: event.target.value }))} rows={3} className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="Exactly what counts as a valid submission." />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-muted-foreground">Example proof</label>
              <textarea value={form.exampleProof} onChange={(event) => setForm((prev) => ({ ...prev, exampleProof: event.target.value }))} rows={3} className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="Show the community what a strong proof submission looks like." />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-muted-foreground">Owner note</label>
              <textarea value={form.ownerNote || ''} onChange={(event) => setForm((prev) => ({ ...prev, ownerNote: event.target.value }))} rows={2} className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="Optional note for why this mission matters today." />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button type="button" onClick={handlePublish} disabled={!form.title || !form.missionBrief || !selectedTokenSlug || publishing} className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary transition hover:bg-primary/15 disabled:opacity-60">
              <CheckCircle2 className="w-4 h-4" />
              {publishing ? 'Publishing...' : 'Publish quest'}
            </button>
            {publishedQuest ? (
              <button type="button" onClick={() => navigate('/dashboard/quests')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background-subtle px-4 py-2 text-sm text-foreground transition hover:border-primary/40">
                Go to Quest Arena
              </button>
            ) : null}
          </div>

          {status ? <div className="rounded-lg border border-border bg-background-subtle px-4 py-3 text-sm text-muted-foreground">{status}</div> : null}
        </div>
      </div>
    </div>
  );
}
