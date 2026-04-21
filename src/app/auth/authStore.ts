import { env } from '../lib/env';

export interface AuthActor {
  userId: string;
  username: string;
  displayName: string;
  isAuthenticated: boolean;
}

let currentActor: AuthActor = {
  userId: env.currentUser,
  username: env.currentUser,
  displayName: 'Guest',
  isAuthenticated: false,
};

export function getCurrentActor() {
  return currentActor;
}

export function setCurrentActor(actor: Partial<AuthActor> | null) {
  if (!actor) {
    currentActor = {
      userId: env.currentUser,
      username: env.currentUser,
      displayName: 'Guest',
      isAuthenticated: false,
    };
    return currentActor;
  }

  currentActor = {
    userId: actor.userId || env.currentUser,
    username: actor.username || env.currentUser,
    displayName: actor.displayName || actor.username || 'Guest',
    isAuthenticated: Boolean(actor.isAuthenticated),
  };
  return currentActor;
}
