import { describe, expect, it } from 'vitest';
import { networkCommandSchema, networkProfileSchema, networkQuerySchema } from './networking';

const profile = { action: 'profile', name: 'Testbesökare', organization: '', role: '', interests: [], seeking: '', offering: '', days: [], visible: false, consent: false, consent_version: 'network-v2' };
describe('Nätverkandets regler', () => {
  it('kräver aktivt medgivande när profilen blir sökbar', () => {
    expect(networkProfileSchema.safeParse({ ...profile, visible: true }).success).toBe(false);
    expect(networkProfileSchema.safeParse({ ...profile, visible: true, consent: true }).success).toBe(true);
  });
  it('tillåter en privat profil utan medgivande', () => {
    expect(networkProfileSchema.safeParse(profile).success).toBe(true);
  });
  it('kräver aktuell version av informationen', () => {
    expect(networkProfileSchema.safeParse({ ...profile, consent_version: 'old' }).success).toBe(false);
  });
  it('tar inte emot privata mål, schema eller kontaktuppgifter', () => {
    for (const field of ['goals', 'feedback', 'email', 'phone', 'favorites'])
      expect(networkProfileSchema.safeParse({ ...profile, [field]: 'private' }).success).toBe(false);
  });
  it('godtar bara verkliga datum', () => {
    expect(networkProfileSchema.safeParse({ ...profile, days: ['2026-02-30'] }).success).toBe(false);
  });
  it('kräver en avgränsad förfrågan', () => {
    const command = { action: 'request', target: '00000000-0000-4000-8000-000000000001', text: 'Hej' };
    expect(networkCommandSchema.safeParse(command).success).toBe(true);
    expect(networkCommandSchema.safeParse({ ...command, text: 'x'.repeat(1001) }).success).toBe(false);
  });
  it('kräver ett samtal för meddelandeläsning', () => {
    expect(networkQuerySchema.safeParse({ mode: 'messages' }).success).toBe(false);
  });
});