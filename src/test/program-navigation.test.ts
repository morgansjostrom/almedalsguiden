import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const bridge = readFileSync('public/program-anchor.js', 'utf8');
const guard = readFileSync('public/program-redirect.js', 'utf8');

function embedded(search: string) {
  const frame = { src: '' };
  new Function('document', 'location', bridge)({ getElementById: () => frame }, { search });
  return new URL(frame.src, 'https://example.test/');
}

describe('Homepage program navigation', () => {
  it('preserves the full event identity and selects its program year', () => {
    const url = embedded('?event=6531%7C2027-06-24%7C10%3A30');
    expect(url.searchParams.get('event')).toBe('6531|2027-06-24|10:30');
    expect(url.searchParams.get('year')).toBe('2027');
    expect(url.searchParams.get('day')).toBe('2027-06-24');
    expect(url.searchParams.get('embed')).toBe('1');
  });

  it('keeps search terms and filters in the embedded program', () => {
    const url = embedded('?q=v%C3%A5rd&day=2026-06-23&year=2026&speakerSearch=Morgan&subject=Demokrati');
    expect(url.searchParams.get('q')).toBe('vård');
    expect(url.searchParams.get('day')).toBe('2026-06-23');
    expect(url.searchParams.get('year')).toBe('2026');
    expect(url.searchParams.get('speakerSearch')).toBe('Morgan');
    expect(url.searchParams.get('subject')).toBe('Demokrati');
  });

  it('redirects old standalone addresses, including embed bookmarks, to the homepage anchor', () => {
    let destination = '';
    const window = { self: {}, top: {} };
    window.top = window.self;
    new Function('window', 'location', guard)(window, {
      href: 'https://example.test/program.html?event=6531%7C2027-06-24%7C10%3A30&embed=1',
      search: '?event=6531%7C2027-06-24%7C10%3A30&embed=1',
      replace: (url: string) => { destination = url; },
    });
    const url = new URL(destination);
    expect(url.pathname).toBe('/');
    expect(url.hash).toBe('#programrubrik');
    expect(url.searchParams.get('event')).toBe('6531|2027-06-24|10:30');
    expect(url.searchParams.has('embed')).toBe(false);
  });

  it('does not redirect the genuine iframe', () => {
    let redirected = false;
    new Function('window', 'location', guard)({ self: {}, top: {} }, {
      search: '?embed=1',
      replace: () => { redirected = true; },
    });
    expect(redirected).toBe(false);
  });
});