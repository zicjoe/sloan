import { Settings as SettingsIcon, User, Bell, Palette, Link2 } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { useState } from 'react';

export function Settings() {
  const [notifications, setNotifications] = useState({
    predictions: true,
    quests: true,
    raids: false,
    prophets: true,
  });

  return (
    <div className="p-8 space-y-8">
      <SectionHeader
        title="Settings"
        subtitle="Manage your account and preferences"
        icon={<SettingsIcon className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-foreground">Profile Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  defaultValue="You"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Username
                </label>
                <input
                  type="text"
                  defaultValue="current_user"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Bio
                </label>
                <textarea
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                  rows={4}
                />
              </div>
              <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                Save Profile
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-foreground">Notification Preferences</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background-subtle">
                <div>
                  <p className="text-foreground mb-1">Prediction Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your predictions resolve
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, predictions: !prev.predictions }))}
                  className={`
                    w-12 h-6 rounded-full transition-all relative
                    ${notifications.predictions ? 'bg-primary' : 'bg-muted'}
                  `}
                >
                  <div className={`
                    w-4 h-4 bg-white rounded-full absolute top-1 transition-all
                    ${notifications.predictions ? 'right-1' : 'left-1'}
                  `} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background-subtle">
                <div>
                  <p className="text-foreground mb-1">Quest Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications for new quests and deadlines
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, quests: !prev.quests }))}
                  className={`
                    w-12 h-6 rounded-full transition-all relative
                    ${notifications.quests ? 'bg-primary' : 'bg-muted'}
                  `}
                >
                  <div className={`
                    w-4 h-4 bg-white rounded-full absolute top-1 transition-all
                    ${notifications.quests ? 'right-1' : 'left-1'}
                  `} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background-subtle">
                <div>
                  <p className="text-foreground mb-1">Raid Campaigns</p>
                  <p className="text-sm text-muted-foreground">
                    Updates on raid campaigns you've joined
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, raids: !prev.raids }))}
                  className={`
                    w-12 h-6 rounded-full transition-all relative
                    ${notifications.raids ? 'bg-primary' : 'bg-muted'}
                  `}
                >
                  <div className={`
                    w-4 h-4 bg-white rounded-full absolute top-1 transition-all
                    ${notifications.raids ? 'right-1' : 'left-1'}
                  `} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background-subtle">
                <div>
                  <p className="text-foreground mb-1">Prophet Leaderboard</p>
                  <p className="text-sm text-muted-foreground">
                    When your rank changes significantly
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, prophets: !prev.prophets }))}
                  className={`
                    w-12 h-6 rounded-full transition-all relative
                    ${notifications.prophets ? 'bg-primary' : 'bg-muted'}
                  `}
                >
                  <div className={`
                    w-4 h-4 bg-white rounded-full absolute top-1 transition-all
                    ${notifications.prophets ? 'right-1' : 'left-1'}
                  `} />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="text-foreground">Appearance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-3">
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 rounded-lg bg-background-subtle border-2 border-primary text-left">
                    <div className="w-full h-12 bg-gradient-to-br from-background to-background-elevated rounded mb-2" />
                    <p className="text-sm text-foreground">Dark (Active)</p>
                  </button>
                  <button className="p-4 rounded-lg bg-background-subtle border-2 border-border hover:border-primary/40 text-left transition-all opacity-50">
                    <div className="w-full h-12 bg-gradient-to-br from-gray-100 to-white rounded mb-2" />
                    <p className="text-sm text-foreground">Light (Coming Soon)</p>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-3">
                  Accent Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['#4adeff', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444'].map((color, i) => (
                    <button
                      key={i}
                      className={`
                        w-full h-12 rounded-lg border-2 transition-all
                        ${i === 0 ? 'border-foreground' : 'border-border hover:border-foreground/40'}
                      `}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-6">
              <Link2 className="w-5 h-5 text-primary" />
              <h3 className="text-foreground">Connected Accounts</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background-subtle border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    𝕏
                  </div>
                  <div>
                    <p className="text-foreground">Twitter / X</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-border hover:border-primary/40 transition-all">
                  Connect
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background-subtle border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    TG
                  </div>
                  <div>
                    <p className="text-foreground">Telegram</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-border hover:border-primary/40 transition-all">
                  Connect
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background-subtle border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    DC
                  </div>
                  <div>
                    <p className="text-foreground">Discord</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-border hover:border-primary/40 transition-all">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Account Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                <p className="text-foreground">March 10, 2026</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account Type</p>
                <p className="text-foreground">Free</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total XP</p>
                <p className="text-foreground font-mono">3,400</p>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Privacy & Security</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 rounded-lg bg-background-subtle hover:bg-accent-dim transition-all text-left">
                <p className="text-foreground">Change Password</p>
              </button>
              <button className="w-full px-4 py-3 rounded-lg bg-background-subtle hover:bg-accent-dim transition-all text-left">
                <p className="text-foreground">Two-Factor Auth</p>
              </button>
              <button className="w-full px-4 py-3 rounded-lg bg-background-subtle hover:bg-accent-dim transition-all text-left">
                <p className="text-foreground">Privacy Settings</p>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-lg bg-destructive/5 border border-destructive/20">
            <h3 className="text-destructive mb-4">Danger Zone</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
                Delete Account
              </button>
            </div>
          </div>

          {/* Support */}
          <div className="p-6 rounded-lg bg-card border border-card-border">
            <h3 className="text-foreground mb-4">Support</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 rounded-lg bg-background-subtle hover:bg-accent-dim transition-all text-left">
                <p className="text-foreground">Help Center</p>
              </button>
              <button className="w-full px-4 py-3 rounded-lg bg-background-subtle hover:bg-accent-dim transition-all text-left">
                <p className="text-foreground">Contact Support</p>
              </button>
              <button className="w-full px-4 py-3 rounded-lg bg-background-subtle hover:bg-accent-dim transition-all text-left">
                <p className="text-foreground">Report Bug</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
