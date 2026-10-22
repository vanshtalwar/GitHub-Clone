import { languageColor } from '../../utils/languageColors';
import styles from './LanguageDot.module.css';

export function LanguageDot({ language }: { language: string }) {
  return (
    <span className={styles.language}>
      <span className={styles.dot} style={{ backgroundColor: languageColor(language) }} aria-hidden="true" />
      <span>{language}</span>
    </span>
  );
}
