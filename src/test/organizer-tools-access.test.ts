import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const script = readFileSync('public/organizer-tools-access.js', 'utf8');
async function run(data: Record<string, unknown>) {
  const workspace = { hidden: true };
  const status = { hidden: false, textContent: '' };
  const appendChild = vi.fn();
  const replace = vi.fn();
  const document = {
    getElementById: (id: string) => id === 'ot-access-workspace' ? workspace : status,
    createElement: () => ({ src: '' }),
    body: { appendChild },
  };
  await new Function('document', 'fetch', 'location', `return ${script.slice(script.indexOf('(async'))}`)(document,
    async () => ({ ok: true, json: async () => data }), { replace });
  return { workspace, appendChild, replace };
}
describe('Planning workspace access', () => {
  it('does not initialize tools for a signed-out visitor', async () => {
    const result = await run({ user: null, organizer: false });
    expect(result.appendChild).not.toHaveBeenCalled();
    expect(result.workspace.hidden).toBe(true);
    expect(result.replace).toHaveBeenCalledWith('/arrangor-start.html');
  });
  it('does not initialize tools for a visitor without organizer access', async () => {
    const result = await run({ user: { id: 'visitor' }, organizer: false });
    expect(result.appendChild).not.toHaveBeenCalled();
    expect(result.replace).toHaveBeenCalledWith('/arrangor-start.html');
  });
  it('initializes tools for a verified organizer', async () => {
    const result = await run({ user: { id: 'organizer' }, organizer: true });
    expect(result.workspace.hidden).toBe(false);
    expect(result.appendChild).toHaveBeenCalledWith({ src: 'organizer-tools.js?v=3' });
  });
});