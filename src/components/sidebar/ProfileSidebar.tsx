import { LinkIcon, LocationIcon, MailIcon, OrganizationIcon, PeopleIcon, SmileyIcon } from '@primer/octicons-react';
import { githubUrl } from '../../../shared/github';
import { useProfile } from '../../hooks/useProfile';
import type { GithubUser } from '../../types/github';
import { formatCount } from '../../utils/format';
import { profileSocialLinks, toExternalUrl, type SocialLink } from '../../utils/socials';
import { LinkedInIcon, XLogoIcon } from '../common/BrandIcons';
import { MentionText } from '../common/MentionText';
import { Skeleton } from '../common/Skeleton';
import { Achievements } from './Achievements';
import { Organizations } from './Organizations';
import styles from './ProfileSidebar.module.css';

/**
 * Left panel: everything here comes from GET /users/{username} (requirement 3b), except the status (GraphQL, through
 * the profile details function) and the achievements, which have no API and come from `extras` (sample data).
 */
export function ProfileSidebar() {
  const profile = useProfile();
  if (profile.status !== 'ready') return <SidebarSkeleton />;

  const { user, socials, orgs, extras, userStatus: status } = profile;
  // GitHub shows a smiley when the status has no emoji (or a custom one, which isn't a character)
  const emoji = status?.emoji ? <span aria-hidden="true">{status.emoji}</span> : <SmileyIcon />;

  return (
    <div className={styles.sidebar}>
      <div className={styles.identity}>
        <div className={styles.avatarWrap}>
          <a href={user.avatarUrl} className={styles.avatarLink}>
            <img
              src={user.avatarUrl}
              alt={`View ${user.login}'s full-sized avatar`}
              className={styles.avatar}
              width={296}
              height={296}
            />
          </a>
          {status && (
            <div className={styles.statusBubble} title={status.message}>
              {emoji}
              <span className="sr-only">Status: {status.message}</span>
            </div>
          )}
        </div>
        <h1 className={styles.names}>
          {user.name && <span className={styles.name}>{user.name}</span>}
          <span className={styles.login}>{user.login}</span>
        </h1>
      </div>

      {/* Phones show the status as a line instead of the bubble; only one of the two is ever displayed. */}
      {status && (
        <p className={styles.statusLine}>
          {emoji}
          <span className="sr-only">Status: </span>
          {status.message}
        </p>
      )}

      {user.bio && <Bio bio={user.bio} />}

      {/* The design's owner view: GitHub's own profile editor (it asks the visitor to sign in) */}
      <a href={githubUrl('settings/profile')} className={styles.editButton}>
        Edit profile
      </a>

      <p className={styles.follow}>
        <PeopleIcon className={styles.icon} />
        <a href={`${user.htmlUrl}?tab=followers`}>
          <strong>{formatCount(user.followers)}</strong> {user.followers === 1 ? 'follower' : 'followers'}
        </a>
        <span aria-hidden="true" className={styles.dot}>
          ·
        </span>
        <a href={`${user.htmlUrl}?tab=following`}>
          <strong>{formatCount(user.following)}</strong> following
        </a>
      </p>

      <Details user={user} links={profileSocialLinks(socials, user.twitterUsername)} />

      <Achievements achievements={extras?.achievements ?? []} login={user.login} />
      <Organizations orgs={orgs} />
    </div>
  );
}

function Bio({ bio }: { bio: string }) {
  return (
    <div className={styles.bio}>
      <MentionText text={bio} mentionClassName={styles.mention} />
    </div>
  );
}

const SOCIAL_ICONS: Record<SocialLink['kind'], typeof LinkIcon | typeof LinkedInIcon> = {
  linkedin: LinkedInIcon,
  twitter: XLogoIcon,
  link: LinkIcon,
};

const SOCIAL_NAMES: Record<SocialLink['kind'], string> = { linkedin: 'LinkedIn', twitter: 'X', link: 'Social link' };

function Details({ user, links }: { user: GithubUser; links: SocialLink[] }) {
  return (
    <ul className={styles.details}>
      {user.company && (
        <li>
          <OrganizationIcon className={styles.icon} />
          <span className="sr-only">Company: </span>
          {/* GitHub links every @org in the company field, e.g. "@github, @microsoft" */}
          <span>
            <MentionText text={user.company} mentionClassName={styles.companyOrg} />
          </span>
        </li>
      )}
      {user.location && (
        <li>
          <LocationIcon className={styles.icon} />
          <span className="sr-only">Location: </span>
          <span>{user.location}</span>
        </li>
      )}
      {user.email && (
        <li>
          <MailIcon className={styles.icon} />
          <span className="sr-only">Email: </span>
          <a href={`mailto:${user.email}`}>{user.email}</a>
        </li>
      )}
      {user.blog && (
        <li>
          <LinkIcon className={styles.icon} />
          <span className="sr-only">Website: </span>
          <a href={toExternalUrl(user.blog)} rel="nofollow me">
            {user.blog}
          </a>
        </li>
      )}
      {links.map((link) => {
        const Icon = SOCIAL_ICONS[link.kind];
        return (
          <li key={link.href}>
            <Icon className={styles.icon} />
            <span className="sr-only">{SOCIAL_NAMES[link.kind]}: </span>
            <a href={link.href} rel="nofollow me">
              {link.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarSkeleton() {
  return (
    <div className={styles.sidebar} aria-busy="true" aria-label="Loading profile">
      <div className={styles.identity}>
        <div className={styles.avatarWrap}>
          <Skeleton circle height="auto" style={{ aspectRatio: '1' }} />
        </div>
        <div className={styles.names}>
          <Skeleton width="70%" height={24} />
          <Skeleton width="40%" height={20} style={{ marginTop: 8 }} />
        </div>
      </div>
      <div className={styles.bio}>
        <Skeleton height={14} />
        <Skeleton height={14} width="90%" style={{ marginTop: 8 }} />
        <Skeleton height={14} width="60%" style={{ marginTop: 8 }} />
      </div>
      <Skeleton height={32} />
    </div>
  );
}
