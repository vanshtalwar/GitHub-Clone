import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockUser } from '../../mocks/profile';
import { readyProfile, renderInProfile } from '../../test/render';
import { ProfileSidebar } from './ProfileSidebar';

const detailLink = (name: string | RegExp) => screen.getByRole('link', { name });

describe('ProfileSidebar', () => {
  it('renders the profile from the user API data', () => {
    renderInProfile(<ProfileSidebar />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Shreeram Kushwahashreeramk');
    expect(screen.getByRole('img', { name: "View shreeramk's full-sized avatar" })).toHaveAttribute(
      'src',
      mockUser.avatarUrl,
    );
    // The bio mention (the org avatar link below is also named "@UptimeAI", but has no text)
    expect(screen.getByText('@UptimeAI', { selector: 'a' })).toHaveAttribute('href', 'https://github.com/UptimeAI');
    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', 'https://github.com/settings/profile');
    expect(detailLink('11 followers')).toHaveAttribute('href', 'https://github.com/shreeramk?tab=followers');
    expect(detailLink('3 following')).toBeInTheDocument();

    expect(screen.getByText('UptimeAI')).toBeInTheDocument(); // company
    expect(screen.getByText('Bangalore, India')).toBeInTheDocument();
    expect(detailLink('kushwaha.shreeram@gmail.com')).toHaveAttribute('href', 'mailto:kushwaha.shreeram@gmail.com');
    expect(detailLink('http://shreeramk.com')).toHaveAttribute('href', 'http://shreeramk.com');
    expect(detailLink('in/shreeramkushwaha')).toHaveAttribute('href', 'https://www.linkedin.com/in/shreeramkushwaha');
    expect(detailLink('@pom_fret')).toHaveAttribute('href', 'https://twitter.com/pom_fret');
  });

  it('shows the mock status, achievements and organizations for shreeramk', () => {
    renderInProfile(<ProfileSidebar />);

    expect(screen.getAllByText('Status:', { exact: false })).toHaveLength(2); // bubble (desktop) + line (phones)
    const achievements = screen.getByRole('region', { name: 'Achievements' });
    expect(within(achievements).getAllByRole('img').map((img) => img.getAttribute('alt'))).toEqual([
      'Achievement: Quickdraw',
      'Achievement: YOLO',
      'Achievement: Pull Shark',
    ]);
    expect(within(achievements).getByText('x4')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '@UptimeAI' })).toBeInTheDocument();
  });

  it('shows a live status without an emoji character next to a smiley icon, as GitHub does', () => {
    renderInProfile(<ProfileSidebar />, { profile: readyProfile({ userStatus: { emoji: '', message: 'Shipping' } }) });
    expect(screen.getAllByText('Status: Shipping', { exact: false }).length).toBeGreaterThan(0);
  });

  it('shows only API data for other users, and hides empty sections', () => {
    const profile = readyProfile({
      user: {
        ...mockUser,
        login: 'octo',
        name: null,
        email: null,
        company: '@github, @microsoft',
        blog: 'octo.dev',
        twitterUsername: 'octo',
      },
      socials: [],
      orgs: [],
      userStatus: null,
      extras: null,
    });
    renderInProfile(<ProfileSidebar />, { profile, url: '/octo' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('octo');
    expect(screen.queryByText('Status:', { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Achievements' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Organizations' })).not.toBeInTheDocument();
    expect(screen.queryByText('kushwaha.shreeram@gmail.com')).not.toBeInTheDocument();
    // Every @org in the company field links to it (it used to produce one broken link)
    expect(detailLink('@github')).toHaveAttribute('href', 'https://github.com/github');
    expect(detailLink('@microsoft')).toHaveAttribute('href', 'https://github.com/microsoft');
    expect(detailLink('octo.dev')).toHaveAttribute('href', 'https://octo.dev');
    expect(detailLink('@octo')).toHaveAttribute('href', 'https://twitter.com/octo'); // from twitter_username
  });

  it('shows a skeleton while loading', () => {
    renderInProfile(<ProfileSidebar />, { profile: { status: 'loading' } });
    expect(screen.getByLabelText('Loading profile')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
