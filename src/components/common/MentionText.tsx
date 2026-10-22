import { Fragment } from 'react';
import { githubUrl } from '../../../shared/github';
import { parseBio } from '../../utils/parseBio';

/** Text with @mentions turned into GitHub links (bio, company field). No HTML injection: segments are rendered. */
export function MentionText({ text, mentionClassName }: { text: string; mentionClassName?: string }) {
  return parseBio(text).map((segment, i) =>
    segment.type === 'text' ? (
      <Fragment key={i}>{segment.text}</Fragment>
    ) : (
      <a key={i} href={githubUrl(segment.login)} className={mentionClassName}>
        @{segment.login}
      </a>
    ),
  );
}
