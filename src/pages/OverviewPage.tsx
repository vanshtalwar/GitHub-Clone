import { ContributionsSection } from '../components/overview/ContributionsSection';
import { PopularRepos } from '../components/overview/PopularRepos';
import { useUsername } from '../hooks/useUsername';

export function OverviewPage() {
  const username = useUsername();

  return (
    <section aria-labelledby="overview-heading">
      <h2 id="overview-heading" className="sr-only">
        Overview
      </h2>
      <PopularRepos />
      <ContributionsSection key={username} username={username} />
    </section>
  );
}
