import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockRepos } from '../../mocks/profile';
import { readyProfile, renderInProfile } from '../../test/render';
import { PopularRepos } from './PopularRepos';

const cards = () => within(screen.getByRole('region', { name: 'Popular repositories' })).getAllByRole('listitem');

describe('PopularRepos', () => {
  it('shows the six screenshot repos in order, with "Forked from" and languages', () => {
    renderInProfile(<PopularRepos />);

    expect(cards().map((card) => within(card).getAllByRole('link')[0].textContent)).toEqual([
      'Complete-Python-3-Bootcamp',
      'flutter_login_ui',
      'gitignore',
      'node-opcua-logger',
      'kafkajs',
      'node-opcua-1',
    ]);
    const first = cards()[0];
    expect(within(first).getByText('Public')).toBeInTheDocument();
    expect(within(first).getByRole('link', { name: 'Pierian-Data/Complete-Python-3-Bootcamp' })).toHaveAttribute(
      'href',
      'https://github.com/Pierian-Data/Complete-Python-3-Bootcamp',
    );
    expect(within(first).getByText('Jupyter Notebook')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Customize your pins' })).toBeInTheDocument();
  });

  it('omits the language row when a repo has no language, stars or forks', () => {
    renderInProfile(<PopularRepos />);
    const gitignore = cards()[2];
    expect(within(gitignore).queryByText(/Script|Python|Dart/)).not.toBeInTheDocument();
  });

  it('ranks by stars and shows star and fork counts only when above zero', () => {
    const repos = [
      { ...mockRepos[2], stargazersCount: 1200, forksCount: 0 },
      { ...mockRepos[0], forksCount: 3 },
      ...mockRepos.slice(3),
    ];
    renderInProfile(<PopularRepos />, { profile: readyProfile({ repos }) });

    const [top, second] = cards();
    expect(within(top).getByRole('link', { name: '1200 stars' })).toHaveTextContent('1,200');
    expect(within(top).queryByRole('link', { name: /forks/ })).not.toBeInTheDocument();
    expect(within(second).getByRole('link', { name: '3 forks' })).toBeInTheDocument();
  });

  it('shows placeholders while loading and a message when there are no repos', () => {
    renderInProfile(<PopularRepos />, { profile: { status: 'loading' } });
    expect(screen.getByLabelText('Loading repositories')).toHaveAttribute('aria-busy', 'true');
  });

  it('says when there are no public repositories', () => {
    renderInProfile(<PopularRepos />, { profile: readyProfile({ repos: [] }) });
    expect(screen.getByText('No public repositories yet.')).toBeInTheDocument();
  });
});
