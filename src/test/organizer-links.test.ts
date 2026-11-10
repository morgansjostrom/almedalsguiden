import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

const script = readFileSync('public/organizer-links.js', 'utf8');

async function linkOrganizers(html: string) {
  document.body.innerHTML = html;
  const observers: MutationObserver[] = [];
  const OriginalObserver = globalThis.MutationObserver;
  vi.stubGlobal('MutationObserver', class extends OriginalObserver {
    constructor(callback: MutationCallback) {
      super(callback);
      observers.push(this);
    }
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ profiles: [{ name: 'Almedalskompassen', slug: 'almedalskompassen', active: true }] }),
  }));
  new Function(script)();
  // Wait for the actual fetch/json/decorate chain.
  await vi.waitFor(() => expect(document.querySelector('.paid-organizer-link')).not.toBeNull());
  observers.forEach(observer => observer.disconnect());
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('Organizer profile linking scope', () => {
  it('links article bylines and event organizer fields, including translated article containers', async () => {
    await linkOrganizers('<article data-no-translate><div class="sponsorline">Arrangör: Almedalskompassen</div></article><div id="dialogsender">Arrangör: Almedalskompassen</div><span class="organizer-name">Almedalskompassen</span>');
    expect([...document.querySelectorAll('.paid-organizer-link')].map(a => a.getAttribute('href'))).toEqual([
      '/almedalskompassen', '/almedalskompassen', '/almedalskompassen',
    ]);
  });

  it('never links headings, prose, brand identity or navigation', async () => {
    await linkOrganizers('<header><span class="sponsorline">Almedalskompassen</span></header><main><h1>Om Almedalskompassen</h1><h2 class="sponsorline">Almedalskompassen</h2><p>Almedalskompassen hjälper dig.</p><span class="brand">Almedalskompassen</span><div class="sponsorline">Arrangör: Almedalskompassen</div></main><footer>Almedalskompassen</footer>');
    expect(document.querySelectorAll('.paid-organizer-link')).toHaveLength(1);
    expect(document.querySelector('main > .sponsorline a')?.textContent).toBe('Almedalskompassen');
  });
});