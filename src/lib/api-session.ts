import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// The static pages call /api/* with plain same-origin fetch. Identity is an HttpOnly
// session cookie issued only after the server verified a real auth session (never
// a header or client-supplied id). RLS applies as the user for all reads/writes.
const AT = "ak_at";
const RT = "ak_rt";
const COOKIE_ATTRS = "Path=/; HttpOnly; Secure; SameSite=None; Partitioned";

function env() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Backend not configured");
  return { url, key };
}

function keyFetch(key: string): typeof fetch {
  return (input, init) => {
    const h = new Headers(init?.headers);
    if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
    h.set("apikey", key);
    return fetch(input, { ...init, headers: h });
  };
}

export function anonClient(accessToken?: string): SupabaseClient<Database> {
  const { url, key } = env();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: keyFetch(key),
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}

function readCookie(request: Request, name: string) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return "";
}

export function sessionCookies(accessToken: string, refreshToken: string) {
  const max = 60 * 60 * 24 * 30;
  return [
    `${AT}=${encodeURIComponent(accessToken)}; ${COOKIE_ATTRS}; Max-Age=${max}`,
    `${RT}=${encodeURIComponent(refreshToken)}; ${COOKIE_ATTRS}; Max-Age=${max}`,
  ];
}
export const clearCookies = () => [`${AT}=; ${COOKIE_ATTRS}; Max-Age=0`, `${RT}=; ${COOKIE_ATTRS}; Max-Age=0`];

export type Session = { user: User; db: SupabaseClient<Database>; setCookies: string[] };

/** Verifies the session cookie with the auth server; refreshes when expired. */
export async function getSession(request: Request): Promise<Session | null> {
  const at = readCookie(request, AT);
  const rt = readCookie(request, RT);
  if (!at && !rt) return null;
  if (at) {
    const { data } = await anonClient().auth.getUser(at);
    if (data.user) return { user: data.user, db: anonClient(at), setCookies: [] };
  }
  if (!rt) return null;
  const { data } = await anonClient().auth.refreshSession({ refresh_token: rt });
  if (!data.session || !data.user) return null;
  return {
    user: data.user,
    db: anonClient(data.session.access_token),
    setCookies: sessionCookies(data.session.access_token, data.session.refresh_token),
  };
}

export function reply(data: unknown, status = 200, cookies: string[] = [], cache = "no-store") {
  const headers = new Headers({ "Cache-Control": cache, "Content-Type": "application/json" });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(JSON.stringify(data), { status, headers });
}

export const sameOrigin = (request: Request) =>
  request.headers.get("origin") === new URL(request.url).origin;

/** Only the admin may edit the shared demo organizer profile (Almedalskompassen test organizer). */
export async function isEditor(s: Session | null) {
  if (!s) return false;
  const { data } = await s.db.rpc("has_role", { _user_id: s.user.id, _role: "admin" });
  return !!data;
}

export const displayName = (u: User) =>
  (u.user_metadata?.["full_name"] as string) || (u.user_metadata?.["name"] as string) || u.email || "";
