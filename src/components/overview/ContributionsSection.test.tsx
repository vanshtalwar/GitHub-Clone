import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FallbackNoticeContext } from '../../hooks/useFallbackNotice';
import { mockUser } from '../../mocks/profile';
import { jsonResponse, stubFetch } from '../../test/http';
import { readyProfile, renderInProfile } from '../../test/render';
import { ContributionsSection } from './ContributionsSection';

// Responses of the contributions function (GitHub GraphQL behind it)
const CALENDARS: Record<string, object> = {
  last: {
    total: 2186,
    from: '2025-10-19',
    to: '2025-10-20',
    days: [
      { date: '2025-10-19', count: 0, level: 0 },
      { date: '2025-10-20', count: 2186, level: 4 },
    ],
  },
  2019: {
    total: 1185,
    from: '2019-01-01',
    to: '2019-12-31',
    days: [
      { date: '2019-01-01', count: 0, level: 0 },
      { date: '2019-12-31', count: 1185, level: 4 },
    ],
  },
};

/** The contributions function, answering y=last and y=2019. */
function stubContributions() {
  return stubFetch((url) => {
    const calendar = CALENDARS[new URL(url, 'http://localhost').searchParams.get('y') ?? ''];
    return calendar ? jsonResponse(calendar) : undefined;
  });
}

const thisYear = new Date().getFullYear();
const yearLinks = () => within(screen.getByRole('navigation', { name: 'Contribution years' })).getAllByRole('link');

describe('ContributionsSection', () => {
  it('shows the API total in the heading and the graph with its legend', async () => {
    stubContributions();
    renderInProfile(<ContributionsSection username="shreeramk" />);

    expect(await screen.findByRole('heading', { name: '2,186 contributions in the last year' })).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: 'Contribution graph: 2,186 contributions from 2025-10-19 to 2025-10-20' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn how we count contributions' })).toBeInTheDocument();
    expect(screen.getByText('Less')).toBeInTheDocument();
  });

  it('lists the years from now back to account creation, with the current year selected', () => {
    stubContributions();
    renderInProfile(<ContributionsSection username="shreeramk" />);

    const links = yearLinks();
    expect(links[0]).toHaveTextContent(String(thisYear));
    expect(links[0]).toHaveAttribute('aria-current', 'true');
    expect(links[0]).toHaveAttribute('href', '/shreeramk');
    expect(links.at(-1)).toHaveTextContent('2013'); // mockUser.createdAt
    expect(screen.getByRole('link', { name: '2019' })).toHaveAttribute('href', '/shreeramk?year=2019');
  });

  it('loads a past year on click, and goes back with the browser history', async () => {
    const fetchMock = stubContributions();
    const router = renderInProfile(<ContributionsSection username="shreeramk" />);
    await screen.findByRole('heading', { name: '2,186 contributions in the last year' });

    fireEvent.click(screen.getByRole('link', { name: '2019' }));
    expect(await screen.findByRole('heading', { name: '1,185 contributions in 2019' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?year=2019');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('user=shreeramk&y=2019'), expect.anything());
    expect(screen.getByRole('link', { name: '2019' })).toHaveAttribute('aria-current', 'true');

    await act(() => router.navigate(-1));
    expect(await screen.findByRole('heading', { name: '2,186 contributions in the last year' })).toBeInTheDocument();
  });

  it('opens a year directly from the URL', async () => {
    stubContributions();
    renderInProfile(<ContributionsSection username="shreeramk" />, { url: '/shreeramk?year=2019' });
    expect(await screen.findByRole('heading', { name: '1,185 contributions in 2019' })).toBeInTheDocument();
  });

  it('reports sample data to the layout banner when the API is unreachable', async () => {
    const report = vi.fn();
    renderInProfile(
      <FallbackNoticeContext value={report}>
        <ContributionsSection username="shreeramk" />
      </FallbackNoticeContext>,
    );
    await screen.findByRole('heading', { name: /contributions in the last year/ });
    expect(report).toHaveBeenLastCalledWith('contributions:shreeramk', { rateLimited: false });
  });

  it('shows the activity overview inside the graph box until it is turned off in the settings', async () => {
    stubContributions();
    renderInProfile(<ContributionsSection username="shreeramk" />);
    expect(screen.getByRole('heading', { name: 'Activity overview' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Contribution settings/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Activity overview/ }));
    expect(screen.queryByRole('heading', { name: 'Activity overview' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contribution activity' })).toBeInTheDocument(); // timeline stays
  });

  it('says so instead of inventing data for other users', async () => {
    const profile = readyProfile({ user: { ...mockUser, login: 'octo' } });
    renderInProfile(<ContributionsSection username="octo" />, { profile, url: '/octo' });
    expect(await screen.findByText('Contribution data couldn’t be loaded right now.')).toBeInTheDocument();
  });
});
