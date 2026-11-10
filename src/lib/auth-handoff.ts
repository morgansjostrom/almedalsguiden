import { oauthReturnPath } from "@/lib/oauth-return-path";
import { supabase } from "@/integrations/supabase/client";

const KEY = "almedal:return_to";

export function safeReturn(value: unknown): string {
  const path = oauthReturnPath(value);
  return path === "/" ? "/schema.html" : path;
}
export const rememberReturn = (to: string) => sessionStorage.setItem(KEY, safeReturn(to));
export const recallReturn = (fallback: string) => safeReturn(sessionStorage.getItem(KEY) || fallback);

/** Hands the verified session to the server as HttpOnly cookies, then returns to the static page. */
export async function handoff(fallback: string) {
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s) return false;
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token }),
  });
  if (!res.ok) return false;
  const to = recallReturn(fallback);
  sessionStorage.removeItem(KEY);
  window.location.replace(to);
  return true;
}
