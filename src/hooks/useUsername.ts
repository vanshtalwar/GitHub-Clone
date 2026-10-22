import { useParams } from 'react-router';
import { DEFAULT_USERNAME } from '../config';

/** The profile in the URL (/:username), or the default user. */
export function useUsername(): string {
  return useParams().username ?? DEFAULT_USERNAME;
}
