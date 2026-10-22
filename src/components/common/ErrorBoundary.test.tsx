import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Broken(): never {
  throw new Error('chart chunk failed to load');
}

describe('ErrorBoundary', () => {
  it('shows the fallback instead of breaking the page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React and the boundary log the error
    render(
      <>
        <p>Rest of the page</p>
        <ErrorBoundary fallback={<p>Graph unavailable</p>}>
          <Broken />
        </ErrorBoundary>
      </>,
    );
    expect(screen.getByText('Graph unavailable')).toBeInTheDocument();
    expect(screen.getByText('Rest of the page')).toBeInTheDocument();
  });
});
