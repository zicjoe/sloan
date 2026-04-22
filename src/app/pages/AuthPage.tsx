import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { Loader2, ArrowLeft } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../auth/AuthContext';
import { hasSupabaseBackend } from '../lib/env';

function slugifyUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '').slice(0, 24);
}

export function AuthPage() {
  const { isAuthenticated, loading, signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth();
  const location = useLocation();
  const nextPath = useMemo(() => new URLSearchParams(location.search).get('next') || '/dashboard', [location.search]);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to={nextPath} replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signin') {
        await signInWithPassword(email.trim(), password);
      } else {
        const safeUsername = slugifyUsername(username || displayName || email.split('@')[0] || 'sloan_user');
        await signUpWithPassword({ email: email.trim(), password, username: safeUsername, displayName: displayName.trim() || safeUsername });
        setMessage('Account created. Check your email if Supabase confirmation is enabled, then sign in.');
        setMode('signin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while talking to Supabase auth.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in is not ready yet.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="p-8 rounded-2xl border border-card-border bg-card space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Sloan
          </Link>
          <div className="space-y-3">
            <BrandMark size={48} roundedClassName="rounded-xl" />
            <h1 className="text-3xl text-foreground">Make Sloan real</h1>
            <p className="text-muted-foreground leading-relaxed">
              Sign in to save predictions, quests, Forge packs, and Passport activity to your real profile.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-background-subtle p-1">
            <button type="button" onClick={() => setMode('signin')} className={`px-4 py-3 rounded-lg transition-all ${mode === 'signin' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Sign in</button>
            <button type="button" onClick={() => setMode('signup')} className={`px-4 py-3 rounded-lg transition-all ${mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Create account</button>
          </div>

          {!hasSupabaseBackend && (
            <div className="p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning">
              Supabase env variables are missing. Add your live project URL and anon key before auth can work.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Display name</label>
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Sloan Operator" className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Username</label>
                  <input value={username} onChange={(event) => setUsername(slugifyUsername(event.target.value))} placeholder="sloan_operator" className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Email</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Password</label>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none" />
            </div>

            {error && <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">{error}</div>}
            {message && <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-sm text-primary">{message}</div>}

            <button type="submit" disabled={submitting || loading || !hasSupabaseBackend} className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {(submitting || loading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign in to Sloan' : 'Create Sloan account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-[0.2em]">or</span></div>
          </div>

          <button type="button" onClick={handleGoogle} disabled={submitting || !hasSupabaseBackend} className="w-full px-4 py-3 rounded-lg border border-border hover:border-primary/40 transition-all disabled:opacity-50">
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );

}
