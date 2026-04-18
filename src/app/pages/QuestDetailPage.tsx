import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowUpRight, ClipboardCheck, ImageIcon, Link2, Megaphone, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { useApi, useMutation } from '../hooks/useApi';
import { questApi } from '../services/api';
import type { Quest, QuestLiveEvent, QuestSubmission } from '../types';

const toneStyles: Record<QuestLiveEvent['tone'], string> = {
  accepted: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  joined: 'bg-primary/10 text-primary border-primary/20',
  fresh: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
};

function getProofLabel(quest?: Quest | null) {
  if (!quest) return 'Proof';
  switch (quest.proofType) {
    case 'link':
      return 'Post or reply link';
    case 'image':
      return 'Image or meme link';
    case 'prediction':
      return 'Prediction statement';
    default:
      return 'Text proof';
  }
}

function getProofPlaceholder(quest?: Quest | null) {
  if (!quest) return 'Paste proof here';
  switch (quest.proofType) {
    case 'link':
      return 'https://x.com/yourhandle/status/...';
    case 'image':
      return 'Paste an image link or write the caption concept';
    case 'prediction':
      return `${quest.tokenName || 'This token'} stays hot for 24h if volume expands and holders do not flatten.`;
    default:
      return 'Write what you did, why it matters, and what happened.';
  }
}

function getSuccessCopy(submission: QuestSubmission | null) {
  if (!submission) return '';
  if (submission.status === 'accepted') return `Quest proof accepted. ${submission.xpAwarded} XP added to your quest run.`;
  if (submission.status === 'pending') return 'Quest proof submitted. Sloan marked it pending review because it needs a stronger receipt.';
  return 'Quest proof was too weak. Tighten the receipt and submit again.';
}

function getQuestActionLabel(quest?: Quest | null) {
  if (!quest) return 'Open action';
  switch (quest.category) {
    case 'posting':
      return 'Use Raid Studio';
    case 'prediction':
      return 'Open Prophet League';
    case 'meme':
      return 'Open Launch Forge';
    default:
      return 'Open token';
  }
}

function getQuestActionHref(quest?: Quest | null) {
  if (!quest) return '/dashboard/quests';
  switch (quest.category) {
    case 'posting':
      return '/dashboard/raid-studio';
    case 'prediction':
      return '/dashboard/prophets';
    case 'meme':
      return '/dashboard/forge';
    default:
      return quest.tokenSlug ? `/dashboard/token/${quest.tokenSlug}` : '/dashboard';
  }
}

function getProofIcon(quest?: Quest | null) {
  switch (quest?.proofType) {
    case 'link':
      return <Link2 className="w-4 h-4" />;
    case 'image':
      return <ImageIcon className="w-4 h-4" />;
    case 'prediction':
      return <Sparkles className="w-4 h-4" />;
    default:
      return <ClipboardCheck className="w-4 h-4" />;
  }
}

export function QuestDetailPage() {
  const { questId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [proofValue, setProofValue] = useState('');
  const [note, setNote] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastSubmission, setLastSubmission] = useState<QuestSubmission | null>(null);

  const { data: quests, loading } = useApi(questApi.getAll, [refreshKey]);
  const { data: leaderboard } = useApi(questApi.getLeaderboard, [refreshKey]);
  const { data: liveFeed } = useApi(questApi.getLiveFeed, [refreshKey]);
  const { mutate: joinQuest, loading: joinLoading } = useMutation(questApi.joinQuest);
  const { mutate: submitProof, loading: submitLoading } = useMutation(questApi.submitProof);

  const selectedQuest = useMemo(() => (quests || []).find((quest) => quest.id === questId) || null, [quests, questId]);
  const selectedFeed = (liveFeed || []).filter((entry) => entry.questId === selectedQuest?.id).slice(0, 4);
  const category = searchParams.get('category');
  const backHref = category && category !== 'all' ? `/dashboard/quests?category=${category}` : '/dashboard/quests';

  async function handleJoinQuest() {
    if (!selectedQuest) return;
    const result = await joinQuest({ questId: selectedQuest.id });
    if (result) setRefreshKey((value) => value + 1);
  }

  async function handleSubmitProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedQuest || !proofValue.trim()) return;
    const result = await submitProof({
      questId: selectedQuest.id,
      proofType: selectedQuest.proofType,
      proofValue,
      note,
    });
    if (result) {
      setLastSubmission(result);
      setProofValue('');
      setNote('');
      setRefreshKey((value) => value + 1);
    }
  }

  if (loading) return <LoadingState message="Loading mission..." />;
  if (!selectedQuest) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<Megaphone className="w-8 h-8" />}
          title="Quest not found"
          description="This mission is no longer available. Go back to the queue and pick another one."
          action={<Link to={backHref} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Back to quests</Link>}
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border-subtle bg-card text-foreground hover:border-primary/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to quests</span>
        </button>
        <Link to={backHref} className="text-sm text-primary hover:underline">Return to mission queue</Link>
      </div>

      <SectionHeader
        title={selectedQuest.title}
        subtitle="Quest detail page for the demo loop. Join, submit proof, and use back navigation to return to the full queue."
        icon={<Megaphone className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <div className="rounded-xl bg-card border border-card-border p-5 space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="px-2 py-1 rounded text-xs border bg-primary/10 text-primary border-primary/20 capitalize">{selectedQuest.category}</span>
                  {selectedQuest.difficulty && <span className="px-2 py-1 rounded text-xs border bg-background-subtle text-muted-foreground capitalize">{selectedQuest.difficulty}</span>}
                  {selectedQuest.tokenSlug && <span className="px-2 py-1 rounded text-xs border bg-background-subtle text-muted-foreground font-mono">${selectedQuest.tokenSlug.toUpperCase()}</span>}
                </div>
                <h2 className="text-2xl text-foreground">{selectedQuest.title}</h2>
                <p className="text-sm text-muted-foreground mt-3 leading-6">{selectedQuest.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1.5 justify-end text-primary mb-1"><Trophy className="w-4 h-4" /><span className="font-mono">{selectedQuest.reward} XP</span></div>
                <p className="text-xs text-muted-foreground">{selectedQuest.participants || 0} in mission</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-background-subtle border border-border-subtle">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className="text-sm text-foreground capitalize">{selectedQuest.status?.replace('_', ' ') || 'open'}</p>
              </div>
              <div className="p-3 rounded-lg bg-background-subtle border border-border-subtle">
                <p className="text-xs text-muted-foreground mb-1">Proof Type</p>
                <div className="flex items-center gap-2 text-sm text-foreground capitalize">{getProofIcon(selectedQuest)}<span>{selectedQuest.proofType || 'text'}</span></div>
              </div>
              <div className="p-3 rounded-lg bg-background-subtle border border-border-subtle">
                <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                <p className="text-sm text-foreground">{selectedQuest.deadline ? new Date(selectedQuest.deadline).toLocaleDateString() : 'Open ended'}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border-subtle bg-background-subtle p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Zap className="w-3 h-3" /><span>Mission brief</span></div>
                <p className="text-sm text-foreground-muted leading-6">{selectedQuest.missionBrief}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><ClipboardCheck className="w-3 h-3" /><span>Submission rule</span></div>
                <p className="text-sm text-foreground-muted leading-6">{selectedQuest.submissionRule}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Sparkles className="w-3 h-3" /><span>Example proof</span></div>
                <p className="text-sm text-foreground leading-6">{selectedQuest.exampleProof}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border-subtle p-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-mono">{selectedQuest.progress || 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${selectedQuest.progress || 0}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-card-border p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-foreground text-lg">Join and submit</h3>
              <Link
                to={getQuestActionHref(selectedQuest)}
                className="px-4 py-2 rounded-lg border border-border-subtle bg-background-subtle text-foreground hover:border-primary/30 transition-all inline-flex items-center gap-2"
              >
                <span>{getQuestActionLabel(selectedQuest)}</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <button
              type="button"
              onClick={handleJoinQuest}
              disabled={joinLoading || selectedQuest.joined}
              className="px-4 py-3 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 transition-all disabled:opacity-60"
            >
              {selectedQuest.joined ? 'Joined' : joinLoading ? 'Joining...' : 'Join Quest'}
            </button>

            <form onSubmit={handleSubmitProof} className="space-y-4">
              {!selectedQuest.joined ? (
                <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 text-sm text-foreground-muted">
                  Join the mission first. Then submit proof and let Sloan score the receipt.
                </div>
              ) : null}

              <div>
                <label className="block text-sm text-muted-foreground mb-2">{getProofLabel(selectedQuest)}</label>
                <textarea
                  value={proofValue}
                  onChange={(event) => setProofValue(event.target.value)}
                  placeholder={getProofPlaceholder(selectedQuest)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Why this proof matters</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add context so Sloan can tell whether this is real participation or just noise."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="rounded-lg bg-background-subtle border border-border-subtle p-3 text-sm text-foreground-muted">
                Sloan reviews receipts deterministically. Public X links pass posting missions fastest. Prediction quests need a condition. Thin one-liners get pushed to pending or rejected.
              </div>

              <button
                type="submit"
                disabled={submitLoading || !selectedQuest.joined || !proofValue.trim()}
                className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70"
              >
                {submitLoading ? 'Submitting proof...' : 'Submit Proof'}
              </button>
            </form>

            {lastSubmission && (
              <div className={`rounded-lg border p-4 ${lastSubmission.status === 'accepted' ? 'bg-success/5 border-success/20' : lastSubmission.status === 'pending' ? 'bg-warning/5 border-warning/20' : 'bg-destructive/5 border-destructive/20'}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm text-foreground">{getSuccessCopy(lastSubmission)}</p>
                  <span className="text-xs font-mono text-muted-foreground">{lastSubmission.xpAwarded} XP</span>
                </div>
                {lastSubmission.reviewSummary ? <p className="text-xs text-muted-foreground leading-5">{lastSubmission.reviewSummary}</p> : null}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl bg-card border border-card-border p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="text-foreground">Recent activity on this mission</h4>
              <span className="text-xs text-muted-foreground">{selectedFeed.length} events</span>
            </div>
            {selectedFeed.length > 0 ? (
              <div className="space-y-3">
                {selectedFeed.map((entry) => (
                  <div key={entry.id} className="p-3 rounded-lg bg-background-subtle border border-border-subtle">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-sm text-foreground">{entry.title}</p>
                      <span className={`px-2 py-1 rounded-full border text-[11px] capitalize ${toneStyles[entry.tone]}`}>{entry.tone}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.subtitle}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Megaphone className="w-7 h-7" />} title="No activity yet" description="Join the mission or submit proof to make this feed move during the demo." />
            )}
          </div>

          <div className="rounded-xl bg-card border border-card-border p-4">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h4 className="text-foreground">Quest Leaderboard</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="w-3 h-3" /><span>{leaderboard?.length || 0} raiders tracked</span></div>
            </div>
            <div className="space-y-3">
              {(leaderboard || []).map((entry, index) => (
                <div key={entry.username} className="p-3 rounded-lg bg-background-subtle border border-border-subtle flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                      <p className="text-sm text-foreground">{entry.username}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.completed} completed • {entry.pending} pending • {entry.streak} streak</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-primary font-mono">{entry.xp} XP</p>
                    <p className="text-[11px] text-muted-foreground">{entry.badges.join(' • ') || 'No badge yet'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
