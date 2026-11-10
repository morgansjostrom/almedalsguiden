import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type EventRecord = {
  id: string | number;
  day: string;
  start: string;
  title?: string;
  speakers?: Array<{ name?: string; title?: string; organization?: string }>;
  sourceData?: Record<string, string>;
  [key: string]: unknown;
};

type Translation = {
  sourceSignature: string;
  content: { title: string };
};

const fields = ['title', 'description', 'extendedDescription', 'detail', 'category', 'subject', 'subject2', 'eventType', 'organizationType', 'accessibility', 'instructions'];
const manifest = JSON.parse(readFileSync('public/translations/en-runtime/manifest.json', 'utf8')) as {
  records: number;
  chunks: Array<{ file: string; count: number }>;
};
const events = JSON.parse(readFileSync('public/program-runtime/events-2025-65880c9e9916ff81.json', 'utf8')) as EventRecord[];
const byRef = new Map(events.map((event) => [`${event.id}|${event.day}|${event.start}`, event]));
const chunks2025 = manifest.chunks.filter((chunk) => chunk.file.includes('/en-2025-'));
const translations: Record<string, Translation> = Object.assign(
  {},
  ...chunks2025.map((chunk) => JSON.parse(readFileSync(`public${chunk.file}`, 'utf8'))),
);

function sourceSignature(event: EventRecord) {
  const source: Record<string, unknown> = Object.fromEntries(fields.map((field) => [
    field,
    field === 'instructions' ? event.sourceData?.['Instruktion till deltagare'] || '' : event[field] || '',
  ]));
  source['speakers'] = (event.speakers || []).map((person) => ({
    name: person.name || '',
    title: person.title || '',
    organization: person.organization || '',
  }));
  return JSON.stringify(source);
}

describe('2025 English program titles', () => {
  it('contains exactly 1,650 unique title translations and preserves the total of 4,861 English records', () => {
    expect(chunks2025).toHaveLength(7);
    expect(chunks2025.reduce((sum, chunk) => sum + chunk.count, 0)).toBe(1650);
    expect(Object.keys(translations)).toHaveLength(1650);
    expect(manifest.records).toBe(4861);
    expect(manifest.chunks.reduce((sum, chunk) => sum + chunk.count, 0)).toBe(4861);
  });

  it('keeps the supplied English titles attached to their exact event identities', () => {
    expect(translations['554|2025-06-23|07:00']!.content.title).toBe('Sweden is falling behind — why is the e-krona taking so long?');
    expect(translations['357|2025-06-27|19:45']!.content.title).toBe('What does Ebba Busch want?');
  });

  it('matches every current Swedish source and translates only the title, leaving other fields untouched', () => {
    for (const [ref, translation] of Object.entries(translations)) {
      const event = byRef.get(ref);
      expect(event, ref).toBeDefined();
      expect(translation.sourceSignature, ref).toBe(sourceSignature(event!));
      expect(Object.keys(translation.content), ref).toEqual(['title']);
      expect(translation.content.title.trim().length, ref).toBeGreaterThan(0);
    }
  });
});
