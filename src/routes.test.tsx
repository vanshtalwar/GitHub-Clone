// Whole-app routing tests. fetch fails by default (src/test/setup.ts), so shreeramk renders from mock data.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { routes } from './routes';
import { jsonResponse, stubFetch } from './test/http';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

function profileTabs() {
  return within(screen.getByRole('navigation', { name: 'User profile' }));
}

function activeTab() {
  return profileTabs().getByRole('link', { current: 'page' });
}

describe('routes', () => {
  it('redirects / to the default profile', async () => {
    const router = renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Overview', level: 2 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/shreeramk');
    expect(activeTab()).toHaveAccessibleName('Overview');
  });

  it.each([
    ['/shreeramk', 'Overview'],
    ['/shreeramk/repositories', 'Repositories'],
    ['/shreeramk/projects', 'Projects'],
    ['/shreeramk/packages', 'Packages'],
    ['/shreeramk/stars', 'Stars'],
  ])('opens %s directly on the %s tab', async (path, tab) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { name: tab, level: 2 })).toBeInTheDocument();
    expect(activeTab()).toHaveAccessibleName(new RegExp(`^${tab}`));
  });

  it('switches tabs on click and supports back/forward', async () => {
    const router = renderAt('/shreeramk');
    await screen.findByRole('heading', { name: 'Overview', level: 2 });

    fireEvent.click(profileTabs().getByRole('link', { name: /^Repositories/ }));
    expect(await screen.findByRole('heading', { name: 'Repositories', level: 2 })).toBeInTheDocument();
    fireEvent.click(profileTabs().getByRole('link', { name: /^Packages/ }));
    expect(await screen.findByRole('heading', { name: 'Packages', level: 2 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/shreeramk/packages');

    await act(() => router.navigate(-1));
    expect(activeTab()).toHaveAccessibleName(/^Repositories/);
    await act(() => router.navigate(1));
    expect(activeTab()).toHaveAccessibleName(/^Packages/);
  });

  it('shows tab counters and the sample-data banner when GitHub is unreachable', async () => {
    renderAt('/shreeramk');
    expect(await screen.findByRole('status')).toHaveTextContent('Showing sample data');
    expect(profileTabs().getByRole('link', { name: 'Repositories (31)' })).toBeInTheDocument();
    expect(profileTabs().getByRole('link', { name: 'Packages' })).toBeInTheDocument();
    expect(profileTabs().getByRole('link', { name: 'Stars (6)' })).toBeInTheDocument();
  });

  it('names the browser tab after the profile', async () => {
    renderAt('/shreeramk');
    await screen.findByRole('heading', { level: 1 });
    expect(document.title).toBe('shreeramk (Shreeram Kushwaha)');
  });

  it('redirects unknown paths to /', async () => {
    const router = renderAt('/shreeramk/not-a-tab');
    expect(await screen.findByRole('heading', { name: 'Overview', level: 2 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/shreeramk');
  });

  it('shows an error, not sample data, for other users when GitHub is unreachable', async () => {
    renderAt('/torvalds/stars');
    expect(await screen.findByRole('heading', { name: 'Couldn’t load this profile' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'User profile' })).not.toBeInTheDocument();
  });

  it('shows a friendly error page instead of React Router’s developer screen', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Boom = () => {
      throw new Error('unexpected');
    };
    // The app's root error page, around a route that crashes
    const router = createMemoryRouter([{ errorElement: routes[0].errorElement, children: [{ path: '/boom', element: <Boom /> }] }], {
      initialEntries: ['/boom'],
    });
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('shows "User not found" for an account that does not exist', async () => {
    stubFetch(() => jsonResponse({ message: 'Not Found' }, { status: 404 }));
    renderAt('/no-such-user-zz9x');
    expect(await screen.findByRole('heading', { name: 'User not found' })).toBeInTheDocument();
  });
});
