import { githubUrl } from '../../../shared/github';
import type { Org } from '../../types/github';
import styles from './SidebarSection.module.css';

/** Public org memberships. Hidden when there are none, like on GitHub. */
export function Organizations({ orgs }: { orgs: Org[] }) {
  if (orgs.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="organizations-heading">
      <h2 id="organizations-heading" className={styles.heading}>
        Organizations
      </h2>
      <ul className={styles.orgs}>
        {orgs.map((org) => (
          <li key={org.login}>
            <a href={githubUrl(org.login)} title={org.login} className={styles.org}>
              <img src={org.avatarUrl} alt={`@${org.login}`} width={32} height={32} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
