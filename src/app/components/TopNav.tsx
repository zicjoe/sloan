import { Search, Bell, Zap, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function TopNav() {
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, profile, signOut } = useAuth();
  const passportPath = profile?.username ? `/dashboard/passport/${profile.username}` : '/auth?next=/dashboard';

  async function handleProfileClick() {
    if (!isAuthenticated) {
      navigate('/auth?next=/dashboard');
      return;
    }
    navigate(passportPath);
  }

  return (
    <header className="h-16 border-b border-border-subtle bg-background-elevated flex items-center px-6 gap-4">
      <div className="flex-1 max-w-2xl">
        <div className={`
          relative flex items-center gap-3 px-4 py-2 rounded-lg border transition-all
          ${searchFocused ? 'border-primary bg-accent-dim' : 'border-border bg-input-background'}
        `}>
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tokens, quests, prophets..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground font-mono">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="px-4 py-2 rounded-lg bg-accent-dim hover:bg-primary/20 text-primary transition-all flex items-center gap-2 border border-primary/20">
          <Zap className="w-4 h-4" />
          <span className="text-sm">250 XP</span>
        </button>

        <button className="relative p-2 rounded-lg hover:bg-accent-dim transition-all">
          <Bell className="w-5 h-5 text-foreground-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button onClick={handleProfileClick} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent-dim transition-all">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-sm">{(profile?.display_name || profile?.username || 'SU').slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm text-foreground">{profile?.display_name || 'Sloan user'}</p>
                <p className="text-xs text-muted-foreground">@{profile?.username}</p>
              </div>
            </button>
            <button onClick={() => signOut()} className="p-2 rounded-lg hover:bg-accent-dim transition-all" title="Sign out">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/auth?next=/dashboard')} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
