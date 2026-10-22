// Server-side only: the profile parts only GitHub's GraphQL API has: the status message on the avatar and the user's
// Projects. Runs in netlify/functions/profile.mts and the Vite middleware.
import type { ProfileDetails, UserStatus } from '../shared/github.ts';
import {
  queryUser,
  readUserRequest,
  respond,
  toHttpResponse,
  type GraphqlOptions,
  type GraphqlResult,
  type HttpResponse,
} from './githubGraphql.ts';

/** How many projects the Projects tab lists (most recently updated first). */
const PROJECTS_SHOWN = 20;

const DETAILS_QUERY = `query ($login: String!) {
  user(login: $login) {
    status { message emojiHTML }
    projectsV2(first: ${PROJECTS_SHOWN}, orderBy: { field: UPDATED_AT, direction: DESC }) {
      totalCount
      nodes { title shortDescription url closed updatedAt }
    }
  }
}`;

interface DetailsUser {
  status: { message: string | null; emojiHTML: string | null } | null;
  projectsV2: {
    totalCount: number;
    nodes: ({ title: string; shortDescription: string | null; url: string; closed: boolean; updatedAt: string } | null)[];
  };
}

/** Handles `?user=<login>`. Never throws. */
export function getProfileDetails(params: URLSearchParams, options: GraphqlOptions): Promise<GraphqlResult<ProfileDetails>> {
  return respond(async () => {
    const user = await queryUser<DetailsUser>(readUserRequest(params, options), DETAILS_QUERY);
    return {
      status: toStatus(user.status),
      projects: {
        totalCount: user.projectsV2.totalCount,
        items: user.projectsV2.nodes.flatMap((project) => (project ? [project] : [])),
      },
    };
  }, 'Unexpected error while loading profile details');
}

/** The HTTP response for the profile details function (cached per user). */
export async function handleProfileDetails(params: URLSearchParams, options: GraphqlOptions): Promise<HttpResponse> {
  return toHttpResponse(await getProfileDetails(params, options), ['user']);
}

/**
 * GitHub's `emoji` field is a shortcode (":dart:"); `emojiHTML` holds the character ("<div>🎯</div>"). Custom
 * emoji are images there, which leaves no character: the UI then shows a smiley icon, as GitHub does.
 */
export function toStatus(status: DetailsUser['status']): UserStatus | null {
  if (!status) return null;
  const emoji = (status.emojiHTML ?? '').replace(/<[^>]*>/g, '').trim();
  const message = (status.message ?? '').trim();
  return emoji || message ? { emoji, message } : null;
}
