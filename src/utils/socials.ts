import type { SocialAccount } from '../types/github';

export interface SocialLink {
  kind: 'linkedin' | 'twitter' | 'link';
  /** What the sidebar shows, e.g. "in/shreeramkushwaha" or "@pom_fret". */
  label: string;
  href: string;
}

/** GitHub's blog field may omit the scheme ("shreeramk.com"). */
export function toExternalUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Formats a social account the way GitHub's sidebar does. */
export function describeSocial({ provider, url }: SocialAccount): SocialLink {
  const href = toExternalUrl(url);
  if (provider === 'linkedin') {
    const handle = /linkedin\.com\/in\/([^/?#]+)/i.exec(href)?.[1];
    return { kind: 'linkedin', label: handle ? `in/${decodeURIComponent(handle)}` : displayUrl(href), href };
  }
  if (provider === 'twitter') {
    const handle = /(?:twitter|x)\.com\/([^/?#]+)/i.exec(href)?.[1];
    return { kind: 'twitter', label: handle ? `@${handle}` : displayUrl(href), href };
  }
  return { kind: 'link', label: displayUrl(href), href };
}

/** Social accounts, plus the profile's twitter_username if the accounts list doesn't already include X/Twitter. */
export function profileSocialLinks(socials: SocialAccount[], twitterUsername: string | null): SocialLink[] {
  const links = socials.map(describeSocial);
  if (twitterUsername && !links.some((link) => link.kind === 'twitter')) {
    links.push(describeSocial({ provider: 'twitter', url: `https://twitter.com/${twitterUsername}` }));
  }
  return links;
}

function displayUrl(href: string): string {
  return href.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}
