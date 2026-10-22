import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockUser } from '../../mocks/profile';
import { readyProfile, renderInProfile } from '../../test/render';
import { TabNav } from './TabNav';

describe('TabNav', () => {
  it('shows counts from the profile, including the mock packages count for shreeramk', () => {
    renderInProfile(<TabNav />);
    expect(screen.getByRole('link', { name: 'Repositories (31)' })).toHaveAttribute('href', '/shreeramk/repositories');
    expect(screen.getByRole('link', { name: 'Packages (5)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Stars (6)' })).toBeInTheDocument();
  });

  it('hides zero counts, and the packages count for other users', () => {
    const profile = readyProfile({ user: { ...mockUser, login: 'octo', publicRepos: 0 }, starredCount: 3, extras: null });
    renderInProfile(<TabNav />, { profile, url: '/octo' });
    expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('href', '/octo/repositories');
    expect(screen.getByRole('link', { name: 'Packages' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Stars (3)' })).toBeInTheDocument();
  });

  it('shows no counts while the profile is loading', () => {
    renderInProfile(<TabNav />, { profile: { status: 'loading' } });
    expect(screen.getByRole('link', { name: 'Repositories' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Stars' })).toBeInTheDocument();
  });

  it('marks only the tab for the current URL as active', () => {
    renderInProfile(<TabNav />, { url: '/shreeramk/stars' });
    expect(screen.getByRole('link', { current: 'page' })).toHaveAccessibleName('Stars (6)');
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });
});
