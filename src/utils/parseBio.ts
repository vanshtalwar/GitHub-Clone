import { LOGIN_PATTERN_SOURCE } from '../../shared/github';

export type BioSegment = { type: 'text'; text: string } | { type: 'mention'; login: string };

// "@login" not preceded by a word character (so emails don't match) and not followed by one.
const MENTION = new RegExp(`(^|[^\\w@./-])@(${LOGIN_PATTERN_SOURCE})(?![\\w-])`, 'gi');

/** Splits a bio into plain text and @mentions, so mentions can be rendered as links without injecting HTML. */
export function parseBio(bio: string): BioSegment[] {
  const segments: BioSegment[] = [];
  let last = 0;
  for (const match of bio.matchAll(MENTION)) {
    const at = match.index + match[1].length;
    if (at > last) segments.push({ type: 'text', text: bio.slice(last, at) });
    segments.push({ type: 'mention', login: match[2] });
    last = at + 1 + match[2].length;
  }
  if (last < bio.length) segments.push({ type: 'text', text: bio.slice(last) });
  return segments;
}
