import { CloudOfflineIcon, TableIcon } from '@primer/octicons-react';
import { githubUrl } from '../../shared/github';
import { Blankslate } from '../components/common/Blankslate';
import { ProjectListItem } from '../components/projects/ProjectListItem';
import { useProfile } from '../hooks/useProfile';
import { formatCount } from '../utils/format';
import styles from './TabPage.module.css';

/** The user's public GitHub Projects (GraphQL, through the profile details function), most recently updated first. */
export function ProjectsPage() {
  const profile = useProfile();

  return (
    <section aria-labelledby="projects-heading">
      <h2 id="projects-heading" className="sr-only">
        Projects
      </h2>
      {profile.status !== 'ready' ? (
        <p className={styles.status}>Loading projects…</p>
      ) : profile.projects === null ? (
        <Blankslate icon={CloudOfflineIcon} title="Couldn’t load projects">
          <p>GitHub’s API couldn’t be reached. Reloading the page tries again.</p>
        </Blankslate>
      ) : profile.projects.items.length === 0 ? (
        <Blankslate icon={TableIcon} title="No projects to show">
          <p>{profile.user.login} doesn’t have any public projects.</p>
        </Blankslate>
      ) : (
        <>
          <ul>
            {profile.projects.items.map((project) => (
              <ProjectListItem key={project.url} project={project} />
            ))}
          </ul>
          {profile.projects.totalCount > profile.projects.items.length && (
            <p className={styles.more}>
              Showing the {profile.projects.items.length} most recently updated of {formatCount(profile.projects.totalCount)}{' '}
              projects. <a href={githubUrl(`${profile.user.login}?tab=projects`)}>View all on GitHub</a>
            </p>
          )}
        </>
      )}
    </section>
  );
}
