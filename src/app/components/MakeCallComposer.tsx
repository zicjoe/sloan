import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { PredictionOpportunity } from '../types';

interface MakeCallComposerProps {
  tokenSlug: string;
  tokenName: string;
  opportunity?: PredictionOpportunity;
  onSubmit?: (call: {
    answer: 'yes' | 'no';
    expiry: string;
    reason?: string;
  }) => void;
}

function callTypeLabel(callType?: PredictionOpportunity['callType']) {
  switch (callType) {
    case 'hold_strength':
      return 'Hold Strength';
    case 'outperform':
      return 'Outperform';
    case 'graduation':
      return 'Graduation';
    case 'breakdown':
      return 'Breakdown';
    case 'momentum':
    default:
      return 'Momentum';
  }
}

export function MakeCallComposer({ tokenName, opportunity, onSubmit }: MakeCallComposerProps) {
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null);
  const [expiry, setExpiry] = useState(opportunity?.timeframe || '24 hours');
  const [reason, setReason] = useState('');

  useEffect(() => {
    setExpiry(opportunity?.timeframe || '24 hours');
    setAnswer(null);
    setReason('');
  }, [opportunity?.id]);

  const handleSubmit = () => {
    if (!answer) return;
    onSubmit?.({
      answer,
      expiry,
      reason: reason.trim() || undefined,
    });
    setAnswer(null);
    setReason('');
  };

  const windows = ['24 hours', '3 days', '7 days', '14 days'];

  return (
    <div className="rounded-xl border border-card-border bg-gradient-to-br from-card to-background-elevated p-6">
      <h3 className="mb-2 text-lg text-foreground">Lock Your Call</h3>
      {opportunity ? (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="mb-1 text-xs font-medium text-primary">AI Selected Setup • {callTypeLabel(opportunity.callType)}</div>
          <p className="text-sm text-foreground leading-relaxed">{opportunity.question}</p>
          {opportunity.resolutionRule ? <p className="mt-2 text-xs text-muted-foreground">{opportunity.resolutionRule}</p> : null}
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => setAnswer('yes')}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${answer === 'yes' ? 'border-success bg-success/10 text-success' : 'border-border text-muted-foreground hover:border-success/40 hover:text-foreground'}`}
        >
          <TrendingUp className="h-6 w-6" />
          <span className="font-medium">Yes</span>
        </button>

        <button
          onClick={() => setAnswer('no')}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${answer === 'no' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-muted-foreground hover:border-destructive/40 hover:text-foreground'}`}
        >
          <TrendingDown className="h-6 w-6" />
          <span className="font-medium">No</span>
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-muted-foreground">Time Window</label>
        <div className="grid grid-cols-2 gap-2">
          {windows.map((time) => (
            <button
              key={time}
              onClick={() => setExpiry(time)}
              className={`rounded-lg border px-3 py-2 text-sm transition-all ${expiry === time ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-muted-foreground">Your Reason <span className="text-xs">(optional)</span></label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={`Why are you backing this ${callTypeLabel(opportunity?.callType).toLowerCase()} on ${tokenName}?`}
          className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          rows={3}
          maxLength={220}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!answer}
        className={`w-full rounded-lg px-6 py-4 text-lg font-medium transition-all ${answer ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(74,222,255,0.3)] hover:bg-primary/90' : 'cursor-not-allowed bg-muted text-muted-foreground'}`}
      >
        Make Call on {tokenName}
      </button>

      {!answer ? <p className="mt-2 text-center text-xs text-muted-foreground">Choose Yes or No to continue</p> : null}
    </div>
  );
}
