import { describe, expect, it } from 'vitest';
import { validProfilePhoto, PROFILE_PHOTO_LIMIT } from './profile-photo';
describe('Profilfoto', () => {
  it('tar emot JPEG men inte filer som bara döpts om', () => {
    expect(validProfilePhoto(new Uint8Array([255,216,255,0]), 'image/jpeg')).toBe(true);
    expect(validProfilePhoto(new Uint8Array([60,115,118,103]), 'image/jpeg')).toBe(false);
  });
  it('begränsar uppladdningen till två MB', () => {
    const bytes = new Uint8Array(PROFILE_PHOTO_LIMIT + 1); bytes.set([255,216,255]);
    expect(validProfilePhoto(bytes, 'image/jpeg')).toBe(false);
  });
});