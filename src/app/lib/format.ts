export function formatUsd(value: number | null | undefined, options?: { compact?: boolean; empty?: string; maxTinyDecimals?: number }) {
  const empty = options?.empty ?? '—';
  if (value == null || !Number.isFinite(value) || value <= 0) return empty;

  const amount = Number(value);
  const compact = options?.compact ?? true;
  const maxTinyDecimals = options?.maxTinyDecimals ?? 12;

  if (amount >= 1_000_000 && compact) {
    return `$${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(amount)}`;
  }

  if (amount >= 1) {
    return `$${new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  }

  if (amount >= 0.01) {
    return `$${amount.toFixed(4)}`;
  }

  if (amount >= 0.000001) {
    return `$${amount.toFixed(8)}`;
  }

  if (amount >= 0.00000001) {
    return `$${amount.toFixed(10)}`;
  }

  if (amount >= 0.0000000001) {
    return `$${amount.toFixed(Math.min(maxTinyDecimals, 12))}`;
  }

  return `$${amount.toExponential(4)}`;
}

export function formatCount(value: number | null | undefined, options?: { empty?: string; compact?: boolean }) {
  const empty = options?.empty ?? '—';
  if (value == null || !Number.isFinite(value) || value <= 0) return empty;

  const amount = Number(value);
  if (options?.compact ?? true) {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(amount);
  }

  return new Intl.NumberFormat('en').format(amount);
}

export function formatPercent(value: number | null | undefined, options?: { empty?: string; digits?: number; showPlus?: boolean }) {
  const empty = options?.empty ?? '—';
  if (value == null || !Number.isFinite(value)) return empty;

  const digits = options?.digits ?? 1;
  const amount = Number(value);
  const prefix = options?.showPlus && amount > 0 ? '+' : '';
  return `${prefix}${amount.toFixed(digits)}%`;
}
