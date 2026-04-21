import { Settings as SettingsIcon, User, Bell, Palette } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function Settings() {
  const { isAuthenticated, profile, saveProfile, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({ predictions: true, quests: true, raids: false, prophets: true });

  useEffect(() => {
    setDisplayName(profile?.display_name || '');
    setUsername(profile?.username || '');
    setBio(profile?.bio || '');
  }, [profile?.display_name, profile?.username, profile?.bio]);

  async function handleSaveProfile() {
    setStatus(null);
    if (!isAuthenticated) {
      setStatus('Sign in first so Sloan can save your real profile.');
      return;
    }

    try {
      setSaving(true);
      await saveProfile({ displayName, username, bio });
      setStatus('Profile saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Profile save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 space-y-8">
      <SectionHeader title="Settings" subtitle="Manage your account and preferences" icon={<SettingsIcon className="w-5 h-5" />} />


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-6"><User className="w-5 h-5 text-primary" /><h3 className="text-foreground">Profile Settings</h3></div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Display Name</label>
                <input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Username</label>
                <input type="text" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Bio</label>
                <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Tell us about yourself..." className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none" rows={4} />
              </div>
              {status && <div className="p-4 rounded-lg bg-background-subtle border border-border text-sm text-foreground-muted">{status}</div>}
              <button onClick={handleSaveProfile} disabled={saving || loading} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-6"><Bell className="w-5 h-5 text-primary" /><h3 className="text-foreground">Notification Preferences</h3></div>
            <div className="space-y-4">
              {[
                { key: 'predictions', title: 'Prediction Updates', copy: 'Get notified when your predictions resolve' },
                { key: 'quests', title: 'Quest Alerts', copy: 'Notifications for new quests and deadlines' },
                { key: 'raids', title: 'Raid Campaigns', copy: 'Updates on raid campaigns you joined' },
                { key: 'prophets', title: 'Prophet Leaderboard', copy: 'When your rank changes significantly' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-background-subtle">
                  <div>
                    <p className="text-foreground mb-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.copy}</p>
                  </div>
                  <button onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))} className={`w-12 h-6 rounded-full transition-all relative ${notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications[item.key as keyof typeof notifications] ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-6"><Palette className="w-5 h-5 text-primary" /><h3 className="text-foreground">Appearance</h3></div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-3">Theme</label>
                <div className="grid grid-cols-1 gap-3">
                  <button className="p-4 rounded-lg bg-background-subtle border-2 border-primary text-left"><div className="w-full h-12 bg-gradient-to-br from-background to-background-elevated rounded mb-2" /><p className="text-sm text-foreground">Dark</p></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Account status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Auth</span><span className="text-foreground">{isAuthenticated ? 'Connected' : 'Guest'}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Profile row</span><span className="text-foreground">{profile ? 'Ready' : 'Missing'}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Passport link</span><span className="text-foreground">{profile?.username || 'Not connected'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
