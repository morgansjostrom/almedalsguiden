import type { Session } from "@/lib/api-session";
import { ownsEvent, type EventLinks, packageQuota, slugify, type PackageTier } from "@/lib/organizer-packages";

export type OrganizerContext = { userId: string; name: string; slug: string; tier: PackageTier; admin: boolean };

/** Verified organizer identity for the signed-in user. The admin acts as the test organizer. */
export async function organizerContext(s: Session | null): Promise<OrganizerContext | null> {
  if (!s) return null;
  const [admin, access, acc] = await Promise.all([
    s.db.rpc("has_role", { _user_id: s.user.id, _role: "admin" }),
    s.db.rpc("has_organizer_access", { _user_id: s.user.id }),
    s.db.from("organizer_accounts").select("organizer_name,slug,package_tier").eq("user_id", s.user.id).maybeSingle(),
  ]);
  if (acc.data && access.data) {
    return { userId: s.user.id, name: acc.data.organizer_name, slug: acc.data.slug || slugify(acc.data.organizer_name), tier: acc.data.package_tier as PackageTier, admin: !!admin.data };
  }
  if (admin.data) return { userId: s.user.id, name: "Almedalskompassen", slug: "almedalskompassen", tier: "grund", admin: true };
  return null;
}

export const quotaOf = (c: OrganizerContext) => packageQuota(c.tier);

type Ev = { id: string | number; day: string; start: string; title: string; organizer?: string };

/** Verifies against this site's public program files that ref is one of the organizer's own events. */
export async function ownEvent(request: Request, name: string, ref: string, links: EventLinks = {}) {
  const [id, day, start] = ref.split("|");
  const base = new URL(request.url).origin;
  const manifest = (await fetch(base + "/program-runtime/manifest.json").then((r) => r.json())) as { byYear: Record<string, { file: string }> };
  const file = manifest.byYear[(day || "").slice(0, 4)]?.file;
  if (!file) return null;
  const rows = (await fetch(base + file).then((r) => r.json())) as Ev[];
  const e = rows.find((r) => String(r.id) === id && r.day === day && r.start === start);
  return e && ownsEvent(e, name, links) ? e : null;
}

/** Admin-set aliases and manual include/exclude refs for an organizer. */
export async function eventLinks(userId: string): Promise<EventLinks> {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const [acc, rows] = await Promise.all([
    db.from("organizer_accounts").select("aliases").eq("user_id", userId).maybeSingle(),
    db.from("organizer_event_links").select("event_ref,mode").eq("organizer_user_id", userId),
  ]);
  const r = rows.data || [];
  return { aliases: acc.data?.aliases || [], include: r.filter((x) => x.mode === "include").map((x) => x.event_ref), exclude: r.filter((x) => x.mode === "exclude").map((x) => x.event_ref) };
}

export const mediaUrl = (key: string) => (key ? "/api/organizer-media?key=" + encodeURIComponent(key) : "");
