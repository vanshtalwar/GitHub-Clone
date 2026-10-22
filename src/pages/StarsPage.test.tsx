import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { jsonResponse, stubFetch } from '../test/http';
import { renderInProfile } from '../test/render';
import { StarsPage } from './StarsPage';

const starredRepo = {
  name: 'react',
  full_name: 'facebook/react',
  html_url: 'https://github.com/facebook/react',
  description: 'The library for web and native user interfaces.',
  private: false,
  visibility: 'public',
  fork: false,
  language: 'JavaScript',
  stargazers_count: 240000,
  forks_count: 50000,
  created_at: '2013-05-24T16:15:54Z',
  updated_at: '2026-10-21T10:00:00Z',
};

describe('StarsPage', () => {
  it('loads the starred repos when the tab opens and shows the owner', async () => {
    const fetchMock = stubFetch((url) =>
      url === 'https://api.github.com/users/shreeramk/starred?per_page=30' ? jsonResponse([starredRepo]) : undefined,
    );
    renderInProfile(<StarsPage />, { url: '/shreeramk/stars' });

    expect(screen.getByText('Loading starred repositories…')).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: 'facebook/react' });
    expect(link).toHaveTextContent('facebook / react');
    expect(link).toHaveAttribute('href', 'https://github.com/facebook/react');
    expect(screen.getByRole('link', { name: '240000 stars' })).toHaveTextContent('240,000');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('says when only the most recent stars are shown', async () => {
    stubFetch(() => jsonResponse([starredRepo]));
    renderInProfile(<StarsPage />, { url: '/shreeramk/stars' }); // starredCount 6, one loaded
    expect(await screen.findByText(/Showing the 1 most recently starred of 6/)).toBeInTheDocument();
  });

  it('explains when GitHub is unreachable', async () => {
    renderInProfile(<StarsPage />, { url: '/shreeramk/stars' });
    expect(await screen.findByRole('heading', { name: 'Couldn’t load starred repositories' })).toBeInTheDocument();
    expect(screen.getByText("GitHub's API couldn't be reached.")).toBeInTheDocument();
  });
});
