import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FallbackBanner } from './FallbackBanner';

describe('FallbackBanner', () => {
  it('explains a rate limit and when it resets', () => {
    render(<FallbackBanner failure={{ rateLimited: true, limit: 60, resetAt: new Date(2026, 9, 22, 15, 15) }} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      "Showing sample data for some sections. GitHub's API rate limit (60 requests per hour) has been reached; try again after 3:15 PM.",
    );
  });

  it('explains a network failure', () => {
    render(<FallbackBanner failure={{ rateLimited: false }} />);
    expect(screen.getByRole('status')).toHaveTextContent("GitHub's API couldn't be reached.");
  });

  it('can be dismissed', () => {
    render(<FallbackBanner failure={{ rateLimited: false }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
