import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { ProfileData, ProfileState } from '../context/loadProfile';
import { ProfileContext } from '../hooks/useProfile';
import { mockExtras, mockOrgs, mockRepos, mockSocials, mockStarredCount, mockUser } from '../mocks/profile';

/** A ready profile built from the mock data (shreeramk, with sample-data extras) unless overridden. */
export function readyProfile(overrides: Partial<ProfileData> = {}): ProfileState {
  return {
    status: 'ready',
    user: mockUser,
    repos: mockRepos,
    socials: mockSocials,
    orgs: mockOrgs,
    starredCount: mockStarredCount,
    extras: mockExtras('shreeramk'),
    ...overrides,
  };
}

/**
 * Renders `ui` at `url` inside a /:username layout route with a fixed profile, the way ProfileLayout provides it.
 * Child routes (not a "/:username/*" splat) so relative links resolve exactly as in the app.
 */
export function renderInProfile(ui: ReactElement, { profile = readyProfile(), url = '/shreeramk' } = {}) {
  const router = createMemoryRouter(
    [
      {
        path: '/:username',
        element: <ProfileContext value={profile}>{ui}</ProfileContext>,
        children: [{ index: true }, { path: '*' }],
      },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
}
