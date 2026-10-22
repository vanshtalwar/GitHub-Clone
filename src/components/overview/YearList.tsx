import { Link } from 'react-router';
import type { ContributionPeriod } from '../../types/github';
import styles from './YearList.module.css';

/**
 * Year links beside the graph. The current year is GitHub's default "last year" view; past years set ?year=YYYY,
 * so the selection survives reloads and works with back/forward.
 */
export function YearList({ years, period, className = '' }: { years: number[]; period: ContributionPeriod; className?: string }) {
  if (years.length === 0) return null;
  const [thisYear] = years;

  return (
    <nav aria-label="Contribution years" className={`${styles.nav} ${className}`}>
      <ul className={styles.list}>
        {years.map((year) => {
          const selected = period === 'last' ? year === thisYear : year === period;
          return (
            <li key={year}>
              <Link
                to={{ search: year === thisYear ? '' : `?year=${year}` }}
                preventScrollReset
                aria-current={selected ? 'true' : undefined}
                className={`${styles.year} ${selected ? styles.selected : ''}`}
              >
                {year}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
