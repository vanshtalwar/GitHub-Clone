import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { useStoredBoolean } from '../../hooks/useStoredBoolean';
import { ContributionSettings } from './ContributionSettings';

function StoredSettings() {
  const [show, setShow] = useStoredBoolean('gh-profile:show-activity-overview', true);
  return (
    <>
      <ContributionSettings showOverview={show} onShowOverviewChange={setShow} />
      <p>{show ? 'overview shown' : 'overview hidden'}</p>
    </>
  );
}

function Uncontrolled() {
  const [show, setShow] = useState(true);
  return (
    <>
      <ContributionSettings showOverview={show} onShowOverviewChange={setShow} />
      <button type="button">Elsewhere</button>
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: /Contribution settings/ });

describe('ContributionSettings', () => {
  it('opens a panel with a read-only private setting and focuses the first editable option', () => {
    render(<Uncontrolled />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('checkbox', { name: /Private contributions/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Private contributions/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Activity overview/ })).toHaveFocus();
  });

  it('closes on Escape and returns focus to the button', () => {
    render(<Uncontrolled />);
    fireEvent.click(trigger());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Contribution settings' })).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it('closes on a click outside', () => {
    render(<Uncontrolled />);
    fireEvent.click(trigger());
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('group', { name: 'Contribution settings' })).not.toBeInTheDocument();
  });

  it('toggles the activity overview and remembers the choice', () => {
    const { unmount } = render(<StoredSettings />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('checkbox', { name: /Activity overview/ }));
    expect(screen.getByText('overview hidden')).toBeInTheDocument();
    expect(localStorage.getItem('gh-profile:show-activity-overview')).toBe('false');

    unmount();
    render(<StoredSettings />); // e.g. after a reload
    expect(screen.getByText('overview hidden')).toBeInTheDocument();
  });
});
