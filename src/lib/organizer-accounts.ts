// Pure rules for invoice-based organizer accounts (no I/O, unit tested).
export const ACCESS_MONTHS = 12;

export function accessPeriod(start: Date) {
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return { starts_at: start.toISOString(), expires_at: end.toISOString() };
}

export function isAccessActive(a: { active: boolean; starts_at: string; expires_at: string }, now = new Date()) {
  return a.active && new Date(a.starts_at) <= now && new Date(a.expires_at) > now;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
/** Readable temporary password (no 0/O/1/l/I), 14 characters. */
export function tempPassword(length = 14) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const validNewPassword = (p: unknown): p is string => typeof p === "string" && p.length >= 10 && p.length <= 128;
