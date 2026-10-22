import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockActivityMonths } from '../../mocks/activity';
import type { ActivityMonth } from '../../types/activity';
import { ContributionActivity } from './ContributionActivity';

const toggle = (name: RegExp) => screen.getByRole('button', { name });

describe('ContributionActivity', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 22, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('shows the latest month like the screenshot, labelled with the current month', () => {
    render(<ContributionActivity months={mockActivityMonths} period="last" login="shreeramk" />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('October 2026');
    expect(screen.getByRole('heading', { name: 'Created 56 commits in 11 repositories' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Opened 29 pull requests in 5 repositories' })).toBeInTheDocument();
  });

  it('collapses commits and expands pull requests by default, and toggles them', () => {
    render(<ContributionActivity months={mockActivityMonths} period="last" login="shreeramk" />);
    const commits = toggle(/^Created 56 commits/);
    const pulls = toggle(/^Opened 29 pull requests/);

    expect(commits).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: '17 commits' })).not.toBeInTheDocument();
    expect(pulls).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'UptimeAI/uptime_webapp' })).toBeInTheDocument();
    expect(screen.getAllByText('merged')).toHaveLength(5);
    expect(screen.getAllByText('open')).toHaveLength(1);

    fireEvent.click(commits);
    expect(commits).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: '17 commits' })).toBeInTheDocument();
    fireEvent.click(pulls);
    expect(pulls).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByText('merged')[0]).not.toBeVisible();
  });

  it('reveals older months one at a time and moves focus to each', () => {
    render(<ContributionActivity months={mockActivityMonths} period="last" login="shreeramk" />);

    fireEvent.click(screen.getByRole('button', { name: 'Show more activity' }));
    const september = screen.getAllByRole('heading', { level: 3 })[1];
    expect(september).toHaveTextContent('September 2026');
    expect(september).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Show more activity' }));
    expect(screen.getAllByRole('heading', { level: 3 })[2]).toHaveTextContent('August 2026');
    expect(screen.queryByRole('button', { name: 'Show more activity' })).not.toBeInTheDocument();
  });

  it('counts months back from December for a past year', () => {
    render(<ContributionActivity months={mockActivityMonths} period={2019} login="shreeramk" />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('December 2019');
  });

  it('says when the activity couldn’t be loaded, or there is none', () => {
    const { rerender } = render(<ContributionActivity months={null} period="last" login="octo" />);
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText('Contribution activity couldn’t be loaded right now.')).toBeInTheDocument();

    rerender(<ContributionActivity months={[]} period="last" login="octo" />);
    expect(screen.getByText('octo has no activity yet for this period.')).toBeInTheDocument();
  });

  it('labels live months with their own date, and shows closed pull requests and private contributions', () => {
    const live: ActivityMonth[] = [
      {
        monthsAgo: 3,
        month: '2026-07',
        items: [
          { kind: 'pullRequests', repos: [{ name: 'octo/a', merged: 1, open: 0, closed: 2 }] },
          { kind: 'private', count: 166 },
        ],
      },
    ];
    render(<ContributionActivity months={live} period="last" login="octo" />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('July 2026');
    expect(screen.getByRole('heading', { name: 'Opened 3 pull requests in 1 repository' })).toBeInTheDocument();
    expect(screen.getByText('closed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '166 contributions in private repositories' })).toBeInTheDocument();
    // GitHub only reveals the count, so there's nothing to expand
    expect(screen.queryByRole('button', { name: /private repositories/ })).not.toBeInTheDocument();
  });
});
