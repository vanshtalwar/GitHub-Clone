import { githubUrl } from '../../../shared/github';
import type { Achievement } from '../../types/github';
import styles from './SidebarSection.module.css';

/** Achievement badges (no public API: they come from the profile's `extras`). Hidden when there are none. */
export function Achievements({ achievements, login }: { achievements: Achievement[]; login: string }) {
  if (achievements.length === 0) return null;
  const href = githubUrl(`${login}?tab=achievements`);

  return (
    <section className={styles.section} aria-labelledby="achievements-heading">
      <h2 id="achievements-heading" className={styles.heading}>
        <a href={href}>Achievements</a>
      </h2>
      <ul className={styles.badges}>
        {achievements.map((achievement) => (
          <li key={achievement.name}>
            <a href={href} className={styles.badge} title={achievement.name}>
              <img src={achievement.image} alt={`Achievement: ${achievement.name}`} width={64} height={64} loading="lazy" />
              {achievement.tier && <span className={styles.tier}>{achievement.tier}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
