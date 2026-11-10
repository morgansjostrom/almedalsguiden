import { describe, expect, it } from 'vitest';
import { contactSchema, CONTACT_RECIPIENT } from '../lib/contact';

const valid = { firstName: 'Anna', lastName: 'Svensson', company: 'Exempel AB', email: 'anna@example.se' };
describe('kontaktformulär', () => {
  it('har den mottagare Morgan angav', () => {
    expect(CONTACT_RECIPIENT).toBe('info@almedalskompassen.se');
  });
  for (const field of ['firstName', 'lastName', 'company', 'email']) {
    it(`kräver ${field}`, () => {
      expect(contactSchema.safeParse({ ...valid, [field]: ' ' }).success).toBe(false);
    });
  }
  it('godkänner fyra kontaktfält och trimmar namn', () => {
    expect(contactSchema.parse({ ...valid, firstName: ' Anna ' })).toEqual(valid);
  });
  it('avvisar ogiltig e-post och valfri mottagare', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'invalid' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, to: 'other@example.se' }).success).toBe(false);
  });
  it('avvisar långa namn och kontrolltecken', () => {
    expect(contactSchema.safeParse({ ...valid, firstName: 'A'.repeat(101) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, company: 'AB\r\nInjected' }).success).toBe(false);
  });
});