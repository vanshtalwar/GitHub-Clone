import { describe, expect, it } from 'vitest';
import { parseBio } from './parseBio';

describe('parseBio', () => {
  it('splits mentions out of the text', () => {
    expect(parseBio('Director of Engineering @UptimeAI\r\n\r\nPython, Angular')).toEqual([
      { type: 'text', text: 'Director of Engineering ' },
      { type: 'mention', login: 'UptimeAI' },
      { type: 'text', text: '\r\n\r\nPython, Angular' },
    ]);
  });

  it('handles mentions at the start, end and next to punctuation', () => {
    expect(parseBio('@a-b works at (@github).')).toEqual([
      { type: 'mention', login: 'a-b' },
      { type: 'text', text: ' works at (' },
      { type: 'mention', login: 'github' },
      { type: 'text', text: ').' },
    ]);
  });

  it('does not treat email addresses or lone @ signs as mentions', () => {
    expect(parseBio('mail me@example.com or @ me')).toEqual([{ type: 'text', text: 'mail me@example.com or @ me' }]);
  });

  it('returns no segments for an empty bio', () => {
    expect(parseBio('')).toEqual([]);
  });
});
