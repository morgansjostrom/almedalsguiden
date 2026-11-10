import { describe, expect, it } from 'vitest';
import { signInLanguage } from '../lib/sign-in-language';
import { cleanUrlTarget } from '../lib/clean-urls';

describe('Sign-in language selection', () => {
  it('uses English for an English device without a saved choice', () => {
    expect(signInLanguage(null, ['en-GB', 'sv-SE'])).toBe('en');
  });
  it('keeps a manually saved Swedish choice on an English device', () => {
    expect(signInLanguage('sv', ['en-GB'])).toBe('sv');
  });
  it('keeps a manually saved English choice on a Swedish device', () => {
    expect(signInLanguage('en', ['sv-SE'])).toBe('en');
  });
  it('uses only the primary device language', () => {
    expect(signInLanguage(null, ['sv-SE', 'en-GB'])).toBe('sv');
  });
});

it('forwards the old sign-in address to the new one', () => {
  expect(cleanUrlTarget('/signin-with-chatgpt')).toBe('/signin');
});