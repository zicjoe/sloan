import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MakeCallComposerProps {
  tokenSlug: string;
  tokenName: string;
  onSubmit?: (call: {
    answer: 'yes' | 'no';
    confidence: number;
    expiry: string;
    reason?: string;
  }) => void;
}

export function MakeCallComposer({ tokenSlug, tokenName, onSubmit }: MakeCallComposerProps) {
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [expiry, setExpiry] = useState('24h');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!answer) return;

    onSubmit?.({
      answer,
      confidence,
      expiry,
      reason: reason.trim() || undefined,
    });

    // Reset form
    setAnswer(null);
    setConfidence(50);
    setExpiry('24h');
    setReason('');
  };

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-card to-background-elevated border border-card-border">
      <h3 className="text-lg text-foreground mb-4">Lock Your Call</h3>

      {/* Answer Selection */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setAnswer('yes')}
          className={`
            p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
            ${answer === 'yes'
              ? 'bg-success/10 border-success text-success'
              : 'border-border hover:border-success/40 text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="font-medium">Yes - Bullish</span>
        </button>

        <button
          onClick={() => setAnswer('no')}
          className={`
            p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
            ${answer === 'no'
              ? 'bg-destructive/10 border-destructive text-destructive'
              : 'border-border hover:border-destructive/40 text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <TrendingDown className="w-6 h-6" />
          <span className="font-medium">No - Bearish</span>
        </button>
      </div>

      {/* Confidence Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-muted-foreground">Confidence</label>
          <span className="text-sm font-mono text-foreground">{confidence}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none bg-muted cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${confidence}%, var(--color-muted) ${confidence}%, var(--color-muted) 100%)`
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">Low</span>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      {/* Expiry Selection */}
      <div className="mb-4">
        <label className="block text-sm text-muted-foreground mb-2">Time Window</label>
        <div className="grid grid-cols-4 gap-2">
          {['24h', '3d', '7d', '14d'].map((time) => (
            <button
              key={time}
              onClick={() => setExpiry(time)}
              className={`
                px-3 py-2 rounded-lg text-sm border transition-all
                ${expiry === time
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Reason */}
      <div className="mb-4">
        <label className="block text-sm text-muted-foreground mb-2">
          Your Reason <span className="text-xs">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Share why you're making this call..."
          className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none text-sm"
          rows={3}
          maxLength={200}
        />
        {reason && (
          <p className="text-xs text-muted-foreground mt-1">
            {reason.length}/200
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!answer}
        className={`
          w-full px-6 py-4 rounded-lg font-medium text-lg transition-all
          ${answer
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(74,222,255,0.3)]'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
          }
        `}
      >
        Make Call on {tokenName}
      </button>

      {!answer && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Select Yes or No to continue
        </p>
      )}
    </div>
  );
}
