import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInProfile } from '../../test/render';
import { Header } from './Header';

const searchBox = () => screen.getByRole('textbox', { name: 'Jump to a GitHub user' });

describe('Header search', () => {
  it('focuses the search box when "/" is pressed', () => {
    renderInProfile(<Header username="shreeramk" />);
    fireEvent.keyDown(document.body, { key: '/' });
    expect(searchBox()).toHaveFocus();
  });

  it('ignores "/" while the user is typing in another field', () => {
    renderInProfile(
      <>
        <input aria-label="Other field" />
        <Header username="shreeramk" />
      </>,
    );
    const other = screen.getByRole('textbox', { name: 'Other field' });
    other.focus();
    fireEvent.keyDown(other, { key: '/' });
    expect(other).toHaveFocus();
  });

  it('opens the typed profile on Enter', () => {
    const router = renderInProfile(<Header username="shreeramk" />);
    fireEvent.change(searchBox(), { target: { value: '  @torvalds ' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(router.state.location.pathname).toBe('/torvalds');
    expect(searchBox()).toHaveValue('');
  });

  it('ignores text that is not a valid username', () => {
    const router = renderInProfile(<Header username="shreeramk" />);
    fireEvent.change(searchBox(), { target: { value: 'not a user!' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(router.state.location.pathname).toBe('/shreeramk');
  });

  it('starts with a skip link to the main content', () => {
    renderInProfile(<Header username="shreeramk" />);
    expect(screen.getAllByRole('link')[0]).toHaveAccessibleName('Skip to content');
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '#main-content');
  });

  it('shows the profile avatar and the username crumb', () => {
    renderInProfile(<Header username="shreeramk" />);
    expect(screen.getByRole('link', { name: 'shreeramk' })).toHaveAttribute('href', '/shreeramk');
    expect(screen.getByRole('link', { name: 'shreeramk on GitHub' }).querySelector('img')).toHaveAttribute(
      'src',
      'https://avatars.githubusercontent.com/u/5489153?v=4',
    );
  });

  it('links its other controls to the matching github.com pages instead of doing nothing', () => {
    renderInProfile(<Header username="shreeramk" />);
    expect(screen.getByRole('link', { name: 'Your issues' })).toHaveAttribute('href', 'https://github.com/issues');
    expect(screen.getByRole('link', { name: 'Your pull requests' })).toHaveAttribute('href', 'https://github.com/pulls');
    expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute('href', 'https://github.com/notifications');
    expect(screen.getByRole('link', { name: 'GitHub Copilot' })).toHaveAttribute('href', 'https://github.com/copilot');
    // The only button left is the (working) phone search toggle
    expect(screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual(['Search']);
  });
});
