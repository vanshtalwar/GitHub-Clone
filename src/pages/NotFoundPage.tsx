import { PersonIcon } from '@primer/octicons-react';
import { Link } from 'react-router';
import { Blankslate } from '../components/common/Blankslate';
import { DEFAULT_USERNAME } from '../config';

export function NotFoundPage({ username }: { username: string }) {
  return (
    <Blankslate icon={PersonIcon} title="User not found">
      <p>
        There isn’t a GitHub account called <strong>{username}</strong>.
      </p>
      <p>
        <Link to={`/${DEFAULT_USERNAME}`}>Go to @{DEFAULT_USERNAME}</Link>
      </p>
    </Blankslate>
  );
}
