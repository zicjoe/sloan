import { Search, Bell, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export function TopNav() {
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-border-subtle bg-background-elevated flex items-center px-6 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-2xl">
        <div className={`
          relative flex items-center gap-3 px-4 py-2 rounded-lg border transition-all
          ${searchFocused
            ? 'border-primary bg-accent-dim'
            : 'border-border bg-input-background'
          }
        `}>
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tokens, quests, prophets..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 rounded-lg bg-accent-dim hover:bg-primary/20 text-primary transition-all flex items-center gap-2 border border-primary/20">
          <Zap className="w-4 h-4" />
          <span className="text-sm">250 XP</span>
        </button>

        <button className="relative p-2 rounded-lg hover:bg-accent-dim transition-all">
          <Bell className="w-5 h-5 text-foreground-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <button
          onClick={() => navigate('/dashboard/passport/current_user')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent-dim transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-sm">CU</span>
          </div>
        </button>
      </div>
    </header>
  );
}
