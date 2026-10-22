import { describe, expect, it } from 'vitest';
import { describeSocial, profileSocialLinks, toExternalUrl } from './socials';

describe('toExternalUrl', () => {
  it('adds https:// only when the scheme is missing', () => {
    expect(toExternalUrl('shreeramk.com')).toBe('https://shreeramk.com');
    expect(toExternalUrl('http://shreeramk.com')).toBe('http://shreeramk.com');
    expect(toExternalUrl('https://shreeram.si')).toBe('https://shreeram.si');
  });
});

describe('describeSocial', () => {
  it('shows LinkedIn as in/handle', () => {
    expect(describeSocial({ provider: 'linkedin', url: 'https://www.linkedin.com/in/shreeramkushwaha/' })).toEqual({
      kind: 'linkedin',
      label: 'in/shreeramkushwaha',
      href: 'https://www.linkedin.com/in/shreeramkushwaha/',
    });
  });

  it('shows X / Twitter as @handle', () => {
    expect(describeSocial({ provider: 'twitter', url: 'https://twitter.com/pom_fret' }).label).toBe('@pom_fret');
    expect(describeSocial({ provider: 'twitter', url: 'https://x.com/pom_fret' }).label).toBe('@pom_fret');
  });

  it('shows other accounts as the bare URL', () => {
    expect(describeSocial({ provider: 'generic', url: 'https://mastodon.social/@octo/' })).toEqual({
      kind: 'link',
      label: 'mastodon.social/@octo',
      href: 'https://mastodon.social/@octo/',
    });
  });
});

describe('profileSocialLinks', () => {
  it('adds twitter_username when the accounts list has no X/Twitter entry', () => {
    expect(profileSocialLinks([], 'pom_fret')).toEqual([
      { kind: 'twitter', label: '@pom_fret', href: 'https://twitter.com/pom_fret' },
    ]);
  });

  it('does not duplicate X/Twitter', () => {
    const links = profileSocialLinks([{ provider: 'twitter', url: 'https://twitter.com/pom_fret' }], 'pom_fret');
    expect(links).toHaveLength(1);
  });
});
