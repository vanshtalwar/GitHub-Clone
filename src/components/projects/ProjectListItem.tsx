import { TableIcon } from '@primer/octicons-react';
import type { Project } from '../../types/github';
import { formatUpdated } from '../../utils/format';
import { Label } from '../common/Label';
import styles from './ProjectListItem.module.css';

/** One row of the Projects tab: title (with "Closed" if so), description and when it was last updated. */
export function ProjectListItem({ project }: { project: Project }) {
  return (
    <li className={styles.item}>
      <h3 className={styles.title}>
        <TableIcon className={styles.icon} />
        <a href={project.url} className={styles.name}>
          {project.title}
        </a>
        {project.closed && <Label>Closed</Label>}
      </h3>
      {project.shortDescription && <p className={styles.description}>{project.shortDescription}</p>}
      <p className={styles.updated}>{formatUpdated(project.updatedAt)}</p>
    </li>
  );
}
