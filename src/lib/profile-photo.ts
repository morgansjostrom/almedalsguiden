export const PROFILE_PHOTO_LIMIT = 2 * 1024 * 1024;
export function validProfilePhoto(bytes: Uint8Array, type: string) {
  return type === 'image/jpeg' && bytes.length > 3 && bytes.length <= PROFILE_PHOTO_LIMIT && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
}