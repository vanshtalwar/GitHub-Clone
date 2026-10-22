import { describe, expect, it } from 'vitest';
import { jsonResponse, stubFetch } from '../test/http';
import { getContributions } from './contributions';
import { NotFoundError } from './http';

const calendar = {
  total: 1185,
  from: '2019-01-01',
  to: '2019-12-31',
  days: [{ date: '2019-01-01', count: 2, level: 1 }],
};

describe('getContributions', () => {
  it('calls the contributions function (GitHub GraphQL behind it) and caches the calendar', async () => {
    const fetchMock = stubFetch(() => jsonResponse(calendar));

    await expect(getContributions('shreeramk', 2019)).resolves.toEqual(calendar);
    expect(fetchMock).toHaveBeenCalledWith('/.netlify/functions/contributions?user=shreeramk&y=2019', expect.anything());

    await getContributions('ShreeramK', 2019); // cache hit (logins are case-insensitive)
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('turns a 404 from the function into NotFoundError', async () => {
    stubFetch(() => jsonResponse({ error: 'GitHub user "nobody" not found' }, { status: 404 }));
    await expect(getContributions('nobody', 'last')).rejects.toBeInstanceOf(NotFoundError);
  });
});
