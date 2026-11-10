import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, it, expect } from 'vitest';
const sandbox: Record<string, any> = {};
runInNewContext(readFileSync('public/network-directory.js', 'utf8'), sandbox);
const { match, select, weekDays, demo } = sandbox['AlmedalNetworkDirectory'];
const person = { user_id: 'b', name: 'Bo', organization: 'Kommunen', role: 'Strateg', interests: ['Demokrati', 'Innovation'], days: ['2026-06-23'], visible: true };
describe('Consented visitor matching', () => {
 it('uses shared interests and shared attendance dates', () => {
  const result = match(person, { visible: true, interests: ['Demokrati'], days: ['2026-06-23'] });
  expect(result.score).toBe(1);
  expect(Array.from(result.interests)).toEqual(['Demokrati']);
 });
 it('never matches a private profile even when its fields overlap', () => {
  expect(match(person, { visible: false, interests: ['Demokrati'], days: person.days }).score).toBe(0);
 });
 it('ignores private goals and saved events', () => {
  expect(match(person, { visible: true, interests: [], days: [], goals: 'Demokrati', favorites: ['2026-06-23'] }).score).toBe(0);
 });
 it('filters topic, organization, role and attendance together', () => {
  expect(select([person], { topic: 'Demokrati', organization: 'kommun', role: 'strateg', day: '2026-06-23' }, null)).toHaveLength(1);
  expect(select([person], { day: '2026-06-24' }, null)).toHaveLength(0);
 });
 it('ranks matches across the supplied directory, excluding hidden profiles', () => {
  const unrelated = { ...person, user_id: 'a', name: 'Anna', interests: [], days: [] };
  const result = select([unrelated, person, { ...person, visible: false }], { sort: 'match' }, { visible: true, interests: ['Demokrati'], days: ['2026-06-23'] });
  expect(result.map((p: any) => p.user_id).join(',')).toBe('b');
 });
});
describe('Fictional directory for filter testing', () => {
 it('contains exactly 20 distinct read-only example profiles with individual photos', () => {
  expect(demo).toHaveLength(20);
  expect(new Set(demo.map((p: any) => p.user_id)).size).toBe(20);
  expect(new Set(demo.map((p: any) => p.photo)).size).toBe(20);
  expect(demo.every((p: any) => p.example === true)).toBe(true);
 });
 it('uses only the upcoming Monday–Friday dates, with participants on every day', () => {
  const days = weekDays().days;
  expect(demo.every((p: any) => p.days.length >= 2 && p.days.every((d: string) => days.includes(d)))).toBe(true);
  for (const day of days) {
   const results = select(demo, { day }, null);
   expect(results.length).toBeGreaterThan(0);
   expect(results.length).toBeLessThan(20);
  }
 });
 it('finds one named person and narrows combined organization, topic and day filters', () => {
  expect(select(demo, { q: 'anna lind' }, null).map((p: any) => p.user_id)).toEqual(['example-0']);
  const filters = { organization: 'Exempelkommunen', topic: 'Demokrati', day: weekDays().days[0] };
  expect(select(demo, filters, null).map((p: any) => p.user_id)).toEqual(['example-0']);
  expect(select(demo, { q: 'saknas-helt' }, null)).toHaveLength(0);
 });
});
describe('Attendance days for week 26', () => {
 it('offers Monday–Friday of week 26 for the upcoming Almedalen Week', () => {
  const result = weekDays(new Date('2026-01-15T12:00:00Z'));
  expect(result.year).toBe(2026);
  expect(result.days).toEqual(['2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26']);
 });
 it('moves to next year once the week has passed', () => {
  const result = weekDays(new Date('2026-11-01T12:00:00Z'));
  expect(result.year).toBe(2027);
  expect(result.days).toEqual(['2027-06-28', '2027-06-29', '2027-06-30', '2027-07-01', '2027-07-02']);
 });
 it('keeps the current year during the week itself', () => {
  expect(weekDays(new Date('2026-06-24T12:00:00Z')).year).toBe(2026);
 });
});
describe('sharper matching', () => {
  const d = () => sandbox['AlmedalNetworkDirectory'];
  const own = { visible: true, days: ['2027-06-28'], interests: ['Klimat'], seeking_tags: ['Finansiering'], offering_tags: ['Mentorskap'] };
  it('gives no match without a shared day', () => {
    expect(d().match({ days: ['2027-06-29'], interests: ['Klimat'], offering_tags: ['Finansiering'] }, own).score).toBe(0);
  });
  it('ranks complementary needs above shared topics', () => {
    const offers = d().match({ days: ['2027-06-28'], interests: [], offering_tags: ['Finansiering'] }, own);
    const topic = d().match({ days: ['2027-06-28'], interests: ['Klimat'] }, own);
    expect(offers.score).toBeGreaterThan(topic.score);
    expect(offers.reasons[0]).toContain('finansiering');
  });
  it('counts shared schedule events and explains them', () => {
    const m = d().match({ days: ['2027-06-28'], shared_events: 2 }, own);
    expect(m.events).toBe(2);
    expect(m.reasons.join(' ')).toContain('2 gemensamma programpunkter');
  });
  it('hides non-matches when sorting by match', () => {
    const list = d().select([{ user_id: 'a', name: 'A', days: ['2027-07-01'], interests: [] }], { sort: 'match' }, own);
    expect(list).toHaveLength(0);
  });
});
