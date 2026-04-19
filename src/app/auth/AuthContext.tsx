import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { env, hasSupabaseBackend } from '../lib/env';
import { setCurrentActor } from './authStore';

export interface AuthProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SaveProfileInput {
  username: string;
  displayName: string;
  bio?: string;
}

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  isAuthenticated: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (input: { email: string; password: string; username: string; displayName: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (input: SaveProfileInput) => Promise<AuthProfile | null>;
  refreshProfile: () => Promise<AuthProfile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normaliseProfile(user: User, profile?: Partial<AuthProfile> | null): AuthProfile {
  const usernameFromMeta = String(user.user_metadata?.username || user.email?.split('@')[0] || env.currentUser).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24) || env.currentUser;
  return {
    id: user.id,
    username: profile?.username || usernameFromMeta,
    display_name: profile?.display_name || (user.user_metadata?.display_name as string | undefined) || user.email?.split('@')[0] || 'Sloan user',
    avatar_url: profile?.avatar_url || null,
    bio: profile?.bio || null,
    created_at: profile?.created_at,
    updated_at: profile?.updated_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(hasSupabaseBackend);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  async function fetchProfile(activeUser: User | null) {
    if (!supabase || !activeUser) {
      setProfile(null);
      setCurrentActor(null);
      return null;
    }

    const { data } = await supabase.from('profiles').select('*').eq('id', activeUser.id).maybeSingle();
    const next = normaliseProfile(activeUser, data);

    // Ensure row exists for older projects before trigger was added.
    await supabase.from('profiles').upsert({
      id: next.id,
      username: next.username,
      display_name: next.display_name,
      avatar_url: next.avatar_url,
      bio: next.bio,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    setProfile(next);
    setCurrentActor({ userId: next.id, username: next.username, displayName: next.display_name || next.username, isAuthenticated: true });
    return next;
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setCurrentActor(null);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await fetchProfile(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      fetchProfile(nextSession?.user ?? null).finally(() => setLoading(false));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signInWithPassword(email: string, password: string) {
    if (!supabase) throw new Error('Supabase auth is not configured');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpWithPassword(input: { email: string; password: string; username: string; displayName: string }) {
    if (!supabase) throw new Error('Supabase auth is not configured');
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          username: input.username,
          display_name: input.displayName,
        },
      },
    });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    if (!supabase) throw new Error('Supabase auth is not configured');
    const redirectTo = env.supabaseRedirectUrl || `${window.location.origin}/auth`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setCurrentActor(null);
  }

  async function saveProfile(input: SaveProfileInput) {
    if (!supabase) throw new Error('Supabase auth is not configured');
    if (!user) throw new Error('You need to sign in first');

    const payload = {
      id: user.id,
      username: input.username.trim().toLowerCase(),
      display_name: input.displayName.trim(),
      bio: input.bio?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    const next = normaliseProfile(user, data);
    setProfile(next);
    setCurrentActor({ userId: next.id, username: next.username, displayName: next.display_name || next.username, isAuthenticated: true });
    return next;
  }

  async function refreshProfile() {
    return fetchProfile(user);
  }

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    session,
    user,
    profile,
    isAuthenticated: Boolean(user),
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signOut,
    saveProfile,
    refreshProfile,
  }), [loading, session, user, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
