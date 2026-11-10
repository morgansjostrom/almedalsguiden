import { readFileSync } from 'node:fs';
import { describe, expect, it, vi, afterEach } from 'vitest';

const script = readFileSync('public/arrangor-start.js', 'utf8');
function run(fetcher: typeof fetch) {
  const elements = new Map<string, { textContent: string; href: string }>();
  const document = { getElementById: (id: string) => {
    if (!elements.has(id)) elements.set(id, { textContent: '', href: '/signin' });
    return elements.get(id);
  }};
  const replace = vi.fn();
  new Function('document', 'fetch', 'location', script)(document, fetcher, { replace });
  return { elements, replace };
}
afterEach(() => vi.useRealTimers());
describe('Organizer landing status', () => {
  it('keeps login reachable when a status request hangs', async () => {
    vi.useFakeTimers();
    const result = run(vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    })) as typeof fetch);
    await vi.advanceTimersByTimeAsync(8000);
    expect(result.elements.get('organizer-start-status')?.textContent).toContain('kunde inte slutföras');
    expect(result.elements.get('arrangor-start-login')?.href).toBe('/signin');
  });
  it('sends a first-time organizer to required password change', async () => {
    vi.useFakeTimers();
    const result = run(vi.fn(async () => ({ ok: true, json: async () => ({ user: { email: 'organizer@example.test' }, mustChangePassword: true }) })) as unknown as typeof fetch);
    await vi.advanceTimersByTimeAsync(0);
    expect(result.replace).toHaveBeenCalledWith('/arrangor-nytt-losenord');
  });
});