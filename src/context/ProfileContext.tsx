import { useMemo, type ReactNode } from 'react';
import { ProfileContext } from '../hooks/useProfile';
import { useLoader } from '../hooks/useLoader';
import { forksNeedingParents, loadForkParents, loadProfile, withForkParents, type ProfileState } from './loadProfile';

const LOADING: ProfileState = { status: 'loading' };

/**
 * Loads the profile for `username` and shares it with everything below via useProfile().
 * Two stages: the profile renders as soon as its own calls finish; "Forked from …" details follow.
 */
export function ProfileProvider({ username, children }: { username: string; children: ReactNode }) {
  const key = username.toLowerCase();
  const profile = useLoader(key, () => loadProfile(username)).value ?? LOADING;

  const forks = profile.status === 'ready' ? forksNeedingParents(profile.repos) : [];
  const parentsKey = `${key}|${forks.map((repo) => repo.fullName).join(',')}`;
  const parents = useLoader(parentsKey, () => loadForkParents(forks)).value;

  const state = useMemo<ProfileState>(
    () => (profile.status === 'ready' && parents ? { ...profile, repos: withForkParents(profile.repos, parents) } : profile),
    [profile, parents],
  );
  return <ProfileContext value={state}>{children}</ProfileContext>;
}
