import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockActivityOverview } from '../../mocks/activity';
import { ActivityCrossChart } from './ActivityCrossChart';
import { ActivityOverview } from './ActivityOverview';

describe('ActivityOverview', () => {
  it('lists the repositories contributed to', () => {
    render(<ActivityOverview overview={mockActivityOverview} />);
    expect(screen.getByRole('heading', { name: 'Activity overview' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'UptimeAI/uptime_webapp' })).toHaveAttribute(
      'href',
      'https://github.com/UptimeAI/uptime_webapp',
    );
    expect(screen.getByText(/and 13 other repositories/)).toBeInTheDocument();
  });

  it('links the organization chips to the organizations (no filter that filters nothing)', () => {
    render(<ActivityOverview overview={mockActivityOverview} />);
    expect(screen.getByRole('link', { name: '@UptimeAI' })).toHaveAttribute('href', 'https://github.com/UptimeAI');
    expect(screen.getByRole('link', { name: '@timescale' })).toHaveAttribute('href', 'https://github.com/timescale');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses the singular for one other repository', () => {
    render(<ActivityOverview overview={{ ...mockActivityOverview, otherRepoCount: 1 }} />);
    expect(screen.getByText(/and 1 other repository$/)).toBeInTheDocument();
  });
});

describe('ActivityCrossChart', () => {
  it('labels each axis, with percentages only for non-zero shares', () => {
    const { container } = render(<ActivityCrossChart breakdown={mockActivityOverview.breakdown} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Activity overview: 83% commits, 17% pull requests, 0% issues, 0% code review',
    );
    const labels = [...container.querySelectorAll('text')].map((text) => text.textContent);
    expect(labels).toEqual(['Code review', 'Issues', '83%Commits', '17%Pull requests']);
  });

  it('scales the largest share to the full axis', () => {
    const { container } = render(<ActivityCrossChart breakdown={mockActivityOverview.breakdown} />);
    const points = container.querySelector('polygon')!.getAttribute('points')!.split(' ');
    // top, right, bottom, left: commits (largest) reach the axis end (160 - 82); PRs scale to 17/83 of it
    expect(points[3]).toBe('78,120');
    expect(points[2]).toBe(`160,${120 + 17 * (82 / 83)}`);
    expect(container.querySelectorAll('circle')).toHaveLength(2); // markers only where the share is above 0
  });
});
