import { createContext, useContext } from 'react';
import type { ProfileState } from '../context/loadProfile';

/** Provided by <ProfileProvider> (src/context/ProfileContext.tsx) for the profile in the URL. */
export const ProfileContext = createContext<ProfileState | null>(null);

export function useProfile(): ProfileState {
  const state = useContext(ProfileContext);
  if (!state) throw new Error('useProfile() must be used inside <ProfileProvider>');
  return state;
}
