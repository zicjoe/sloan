import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Sparkles,
  Target,
  Swords,
  Trophy,
  RotateCcw,
  Fingerprint,
  Settings
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const baseNavItems = [
  { path: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { path: '/dashboard/forge', label: 'Launch Forge', icon: Sparkles },
  { path: '/dashboard/raid-studio', label: 'Raid Studio', icon: Target },
  { path: '/dashboard/quests', label: 'Quest Arena', icon: Swords },
  { path: '/dashboard/quests/forge', label: 'Quest Forge', icon: Sparkles },
  { path: '/dashboard/prophets', label: 'Prophet League', icon: Trophy },
  { path: '/dashboard/mirror', label: 'Mirror Feed', icon: RotateCcw },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { profile } = useAuth();
  const navItems = [
    ...baseNavItems.slice(0, 6),
    { path: `/dashboard/passport/${profile?.username || 'current_user'}`, label: 'Passport', icon: Fingerprint },
    baseNavItems[6],
  ];

  return (
    <aside className="w-64 border-r border-border-subtle bg-sidebar flex flex-col h-full">
      <div className="p-6 border-b border-border-subtle">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-secondary to-primary bg-[length:200%_200%] animate-[gradient_3s_ease_infinite] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">Sloan</h1>
            <p className="text-xs text-muted-foreground font-mono">Four.meme OS</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive ? 'bg-accent-dim text-primary' : 'text-foreground-muted hover:text-foreground hover:bg-accent-dim/50'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-subtle">
        <div className="px-4 py-3 rounded-lg bg-accent-dim border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">System Status</span>
          </div>
          <p className="text-sm text-foreground">All systems operational</p>
        </div>
      </div>
    </aside>
  );
}
