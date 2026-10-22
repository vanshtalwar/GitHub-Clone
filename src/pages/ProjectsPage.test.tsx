import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockUser } from '../mocks/profile';
import { readyProfile, renderInProfile } from '../test/render';
import type { Project } from '../types/github';
import { ProjectsPage } from './ProjectsPage';

const project = (title: string, extra: Partial<Project> = {}): Project => ({
  title,
  shortDescription: null,
  url: `https://github.com/users/octo/projects/${title}`,
  closed: false,
  updatedAt: '2020-01-01T00:00:00Z',
  ...extra,
});

describe('ProjectsPage', () => {
  it('lists the user’s projects from the API', () => {
    const projects = { totalCount: 2, items: [project('Roadmap', { shortDescription: 'What ships next' }), project('Old', { closed: true })] };
    renderInProfile(<ProjectsPage />, { profile: readyProfile({ projects }), url: '/shreeramk/projects' });

    expect(screen.getByRole('link', { name: 'Roadmap' })).toHaveAttribute('href', 'https://github.com/users/octo/projects/Roadmap');
    expect(screen.getByText('What ships next')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('says when only the most recent projects are shown', () => {
    const projects = { totalCount: 25, items: [project('Roadmap')] };
    renderInProfile(<ProjectsPage />, { profile: readyProfile({ projects }), url: '/shreeramk/projects' });
    expect(screen.getByText(/Showing the 1 most recently updated of 25/)).toBeInTheDocument();
  });

  it('shows GitHub’s empty state when there are none', () => {
    const profile = readyProfile({ user: { ...mockUser, login: 'octo' }, projects: { totalCount: 0, items: [] } });
    renderInProfile(<ProjectsPage />, { profile, url: '/octo/projects' });
    expect(screen.getByRole('heading', { name: 'No projects to show' })).toBeInTheDocument();
    expect(screen.getByText('octo doesn’t have any public projects.')).toBeInTheDocument();
  });

  it('says when they couldn’t be loaded', () => {
    renderInProfile(<ProjectsPage />, { profile: readyProfile({ projects: null }), url: '/shreeramk/projects' });
    expect(screen.getByRole('heading', { name: 'Couldn’t load projects' })).toBeInTheDocument();
  });
});
