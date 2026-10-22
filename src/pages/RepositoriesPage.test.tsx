import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInProfile } from '../test/render';
import { RepositoriesPage } from './RepositoriesPage';

const filter = () => screen.getByRole('searchbox', { name: 'Find a repository' });
const repoNames = () => screen.getAllByRole('heading', { level: 3 }).map((heading) => within(heading).getByRole('link').textContent);

describe('RepositoriesPage', () => {
  it('lists every repo, last updated first, with its details', () => {
    renderInProfile(<RepositoriesPage />, { url: '/shreeramk/repositories' });
    expect(repoNames()).toEqual([
      'node-opcua-1',
      'kafkajs',
      'node-opcua-logger',
      'gitignore',
      'flutter_login_ui',
      'Complete-Python-3-Bootcamp',
    ]);
    const kafkajs = screen.getByRole('link', { name: 'kafkajs' }).closest('li')!;
    expect(within(kafkajs).getByText('Public')).toBeInTheDocument();
    expect(within(kafkajs).getByRole('link', { name: 'tulios/kafkajs' })).toHaveAttribute('href', 'https://github.com/tulios/kafkajs');
    expect(within(kafkajs).getByText('JavaScript')).toBeInTheDocument();
  });

  it('filters by name', () => {
    renderInProfile(<RepositoriesPage />, { url: '/shreeramk/repositories' });
    fireEvent.change(filter(), { target: { value: 'OPCUA' } });
    expect(repoNames()).toEqual(['node-opcua-1', 'node-opcua-logger']);
  });

  it('says when only part of the repositories is shown', () => {
    renderInProfile(<RepositoriesPage />, { url: '/shreeramk/repositories' }); // 31 public repos, 6 loaded
    expect(screen.getByText(/Showing the 6 most recently updated of 31/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/shreeramk?tab=repositories',
    );
  });

  it('says so when nothing matches', () => {
    renderInProfile(<RepositoriesPage />, { url: '/shreeramk/repositories' });
    fireEvent.change(filter(), { target: { value: 'zzz' } });
    expect(screen.getByText('shreeramk doesn’t have any repositories that match.')).toBeInTheDocument();
  });
});
