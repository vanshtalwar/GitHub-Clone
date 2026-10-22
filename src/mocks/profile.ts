// Values copied from the assignment screenshot (design/00-design-from-pdf.jpg).
// The first group is the fallback when a GitHub API call fails; the second group has no public API at all.
// Everything here describes shreeramk only, so it's never shown for another user (see hasMockProfile).
import type { Achievement, GithubUser, Org, ProfileDetails, ProfileExtras, Repo, SocialAccount } from '../types/github';

/** True if the mock data describes this user. Other users never get mock data. */
export function hasMockProfile(username: string): boolean {
  return username.toLowerCase() === mockUser.login;
}

export const mockUser: GithubUser = {
  login: 'shreeramk',
  name: 'Shreeram Kushwaha',
  avatarUrl: 'https://avatars.githubusercontent.com/u/5489153?v=4',
  htmlUrl: 'https://github.com/shreeramk',
  bio: 'Director of Engineering @UptimeAI\r\n\r\nPython, Angular, Javascript, NodeJS, MongoDB, Influx DB, TimescaleDB, Streamsets, Kafka, AWS, Azure, HTML5, CSS',
  company: 'UptimeAI',
  blog: 'http://shreeramk.com',
  location: 'Bangalore, India',
  email: 'kushwaha.shreeram@gmail.com',
  twitterUsername: 'pom_fret',
  publicRepos: 31,
  followers: 11,
  following: 3,
  createdAt: '2013-09-18T18:46:47Z',
};

function mockFork(
  name: string,
  parentFullName: string,
  description: string,
  language: string | null,
  createdAt: string,
): Repo {
  return {
    name,
    fullName: `shreeramk/${name}`,
    htmlUrl: `https://github.com/shreeramk/${name}`,
    description,
    visibility: 'public',
    fork: true,
    parentFullName,
    language,
    stargazersCount: 0,
    forksCount: 0,
    createdAt,
    updatedAt: createdAt,
  };
}

/** The six "Popular repositories" in the screenshot, in order (createdAt keeps them in this order when sorted). */
export const mockRepos: Repo[] = [
  mockFork(
    'Complete-Python-3-Bootcamp',
    'Pierian-Data/Complete-Python-3-Bootcamp',
    'Course Files for Complete Python 3 Bootcamp Course on Udemy',
    'Jupyter Notebook',
    '2019-01-10T10:00:00Z',
  ),
  mockFork('flutter_login_ui', 'MarcusNg/flutter_login_ui', 'https://youtu.be/6kaEbTfb444', 'Dart', '2019-06-02T10:00:00Z'),
  mockFork('gitignore', 'github/gitignore', 'A collection of useful .gitignore templates', null, '2020-03-03T19:41:03Z'),
  mockFork(
    'node-opcua-logger',
    'coussej/node-opcua-logger',
    'An OPCUA Client for logging data to InfluxDB! 🔌 🏭',
    'JavaScript',
    '2020-07-08T08:01:58Z',
  ),
  mockFork('kafkajs', 'tulios/kafkajs', 'A modern Apache Kafka client for node.js', 'JavaScript', '2020-08-26T21:31:40Z'),
  mockFork(
    'node-opcua-1',
    'node-opcua/node-opcua',
    'an implementation of a OPC UA stack fully written in javascript and nodejs - http://node-opcua.github.io/',
    'TypeScript',
    '2020-10-15T14:59:39Z',
  ),
];

export const mockSocials: SocialAccount[] = [
  { provider: 'linkedin', url: 'https://www.linkedin.com/in/shreeramkushwaha' },
  { provider: 'twitter', url: 'https://twitter.com/pom_fret' },
];

export const mockOrgs: Org[] = [
  { login: 'UptimeAI', avatarUrl: 'https://avatars.githubusercontent.com/u/68869855?v=4' },
];

export const mockStarredCount = 6;

/** The status and (no) projects from the design, if the profile details function can't be reached. */
export const mockDetails: ProfileDetails = {
  status: { emoji: '🎯', message: 'Focusing' },
  projects: { totalCount: 0, items: [] },
};

// No usable public API for these: always mock.

export const mockPackagesCount = 5;

/** The three badges in the design screenshot (images in public/achievements/). */
export const mockAchievements: Achievement[] = [
  { name: 'Quickdraw', image: '/achievements/quickdraw.png' },
  { name: 'YOLO', image: '/achievements/yolo.png' },
  { name: 'Pull Shark', image: '/achievements/pull-shark.png', tier: 'x4' },
];

/** The parts with no usable public API (achievements, packages count), for users we have sample data for. */
export function mockExtras(username: string): ProfileExtras | null {
  if (!hasMockProfile(username)) return null;
  return { achievements: mockAchievements, packagesCount: mockPackagesCount };
}
