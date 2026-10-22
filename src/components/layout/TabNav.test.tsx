import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockUser } from '../../mocks/profile';
import { readyProfile, renderInProfile } from '../../test/render';
import { TabNav } from './TabNav';

describe('TabNav', () => {
  it('shows counts from the profile, and none for Packages (its page says none can be listed)', () => {
    renderInProfile(<TabNav />);
    expect(screen.getByRole('link', { name: 'Repositories (31)' })).toHaveAttribute('href', '/shreeramk/repositories');
    expect(screen.getByRole('link', { name: 'Packages' })).toHaveAttribute('href', '/shreeramk/packages');
    expect(screen.getByRole('link', { name: 'Stars (6)' })).toBeInTheDocument();
  });

  it('hides zero counts', () => {
    const profile = readyProfile({ user: { ...mockUser, login: 'octo', publicRepos: 0 }, starredCount: 3, extras: null });
    renderInProfile(<TabNav />, { profile, url: '/octo' });
    expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('href', '/octo/repositories');
    expect(screen.getByRole('link', { name: 'Packages' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Stars (3)' })).toBeInTheDocument();
  });

  it('counts live projects', () => {
    const projects = { totalCount: 2, items: [] };
    renderInProfile(<TabNav />, { profile: readyProfile({ projects }) });
    expect(screen.getByRole('link', { name: 'Projects (2)' })).toHaveAttribute('href', '/shreeramk/projects');
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
