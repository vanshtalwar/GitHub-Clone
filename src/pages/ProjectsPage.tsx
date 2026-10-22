import { TableIcon } from '@primer/octicons-react';
import { Blankslate } from '../components/common/Blankslate';

export function ProjectsPage() {
  return (
    <section aria-labelledby="projects-heading">
      <h2 id="projects-heading" className="sr-only">
        Projects
      </h2>
      <Blankslate icon={TableIcon} title="No projects to show">
        <p>GitHub Projects are only available through the GraphQL API, which needs an access token.</p>
      </Blankslate>
    </section>
  );
}
