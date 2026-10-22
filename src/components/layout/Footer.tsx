import { MarkGithubIcon } from '@primer/octicons-react';
import styles from './Footer.module.css';

const LINKS = [
  ['Terms', 'https://docs.github.com/site-policy/github-terms/github-terms-of-service'],
  ['Privacy', 'https://docs.github.com/site-policy/privacy-policies/github-privacy-statement'],
  ['Security', 'https://github.com/security'],
  ['Status', 'https://www.githubstatus.com/'],
  ['Community', 'https://github.community/'],
  ['Docs', 'https://docs.github.com/'],
  ['Contact', 'https://support.github.com/'],
  ['Manage cookies', 'https://docs.github.com/site-policy/privacy-policies/github-cookies'],
  ['Do not share my personal information', 'https://docs.github.com/site-policy/privacy-policies/github-privacy-statement'],
] as const;

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <MarkGithubIcon size={24} className={styles.mark} />
        <span>© {YEAR} GitHub, Inc.</span>
      </div>
      <nav aria-label="Footer">
        <ul className={styles.links}>
          {LINKS.map(([label, href]) => (
            <li key={label}>
              <a href={href}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
