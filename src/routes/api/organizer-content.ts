import { createFileRoute } from "@tanstack/react-router";
import { getSession, reply, sameOrigin } from "@/lib/api-session";
import { eventLinks, mediaUrl, organizerContext, ownEvent, quotaOf } from "@/lib/organizer-content.server";
import { EVENT_REF, PACKAGE_LABEL, parseSpokespeople } from "@/lib/organizer-packages";

const KEY = /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.jpg$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Organizer's own package content: profile, sponsored articles and featured events.
// Identity comes from the verified session; every write is scoped to the caller.
export const Route = createFileRoute("/api/organizer-content")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const s = await getSession(request);
        const c = await organizerContext(s);
        if (!c) return reply({ error: "forbidden" }, 403, s?.setCookies ?? []);
        const [articles, featured, profile, links] = await Promise.all([
          s!.db.from("organizer_articles").select("*").eq("organizer_user_id", c.userId).order("created_at"),
          s!.db.from("organizer_featured_events").select("event_ref").eq("organizer_user_id", c.userId),
          s!.db.from("organizer_profiles").select("data").eq("slug", c.slug).maybeSingle(),
          eventLinks(c.userId),
        ]);
        return reply({
          organizer: { name: c.name, slug: c.slug, tier: c.tier, packageLabel: PACKAGE_LABEL[c.tier], quota: quotaOf(c) },
          profile: profile.data?.data ?? { name: c.name, description: "", logo: "", website: "", email: "", phone: "" },
          articles: (articles.data || []).map((a) => ({ ...a, image: mediaUrl(a.image_key) })),
          featured: (featured.data || []).map((f) => f.event_ref),
          links,
        }, 200, s!.setCookies);
      },
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return reply({ error: "forbidden" }, 403);
        const s = await getSession(request);
        const c = await organizerContext(s);
        if (!c) return reply({ error: "forbidden" }, 403);
        const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const own = (k: unknown) => typeof k === "string" && KEY.test(k) && k.startsWith(c.userId + "/");
        const ok = (extra: object = {}) => reply({ ok: true, ...extra }, 200, s!.setCookies);

        if (b["action"] === "profile") {
          const website = str(b["website"], 300), email = str(b["email"], 200), logoKey = b["logoKey"];
          if (website) { try { if (new URL(website).protocol !== "https:") throw Error(); } catch { return reply({ error: "Webbplatsen måste börja med https://." }, 400); } }
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: "Kontrollera e-postadressen." }, 400);
          const { data: old } = await db.from("organizer_profiles").select("data").eq("slug", c.slug).maybeSingle();
          const prev = (old?.data || {}) as Record<string, unknown>;
          const logo = logoKey === "" ? "" : own(logoKey) ? mediaUrl(String(logoKey)) : String(prev["logo"] || "");
          const data = { ...prev, slug: c.slug, name: c.name, active: true, logoConfigured: true, logo, cover: prev["cover"] || "",
            description: str(b["description"], 5000), website, email, phone: str(b["phone"], 40), address: str(b["address"], 200) };
          const { error } = await db.from("organizer_profiles").upsert({ slug: c.slug, data: data as any, updated_at: Date.now() });
          return error ? reply({ error: "Profilen kunde inte sparas." }, 500) : ok({ profile: data });
        }

        if (b["action"] === "spokespeople") {
          const r = parseSpokespeople(b["spokespeople"], quotaOf(c).spokespeople);
          if ("error" in r) return reply({ error: r.error }, 400);
          const { data: old } = await db.from("organizer_profiles").select("data").eq("slug", c.slug).maybeSingle();
          const prev = (old?.data || { slug: c.slug, name: c.name, active: true, description: "" }) as Record<string, unknown>;
          const data = { ...prev, slug: c.slug, name: c.name, active: true, spokespeople: r.list };
          const { error } = await db.from("organizer_profiles").upsert({ slug: c.slug, data: data as any, updated_at: Date.now() });
          return error ? reply({ error: "Talespersonerna kunde inte sparas." }, 500) : ok({ profile: data });
        }

        if (b["action"] === "article") {
          const id = typeof b["id"] === "string" ? b["id"] : "";
          const title = str(b["title"], 160), lead = str(b["lead"], 300), body = str(b["body"], 12000), ref = str(b["event_ref"], 80);
          const status = b["status"] === "published" ? "published" : "draft";
          if (!title) return reply({ error: "Skriv en rubrik." }, 400);
          if (!EVENT_REF.test(ref)) return reply({ error: "Välj en av era programpunkter." }, 400);
          const ev = await ownEvent(request, c.name, ref, await eventLinks(c.userId));
          if (!ev) return reply({ error: "Programpunkten tillhör inte er organisation." }, 403);
          const row: Record<string, any> = { title, lead, body, event_ref: ref, status, subjects: [...new Set([(ev as any).subject, (ev as any).subject2].filter(Boolean))], updated_at: new Date().toISOString() };
          if (b["imageKey"] === "") row["image_key"] = "";
          else if (own(b["imageKey"])) row["image_key"] = b["imageKey"];
          if (status === "published" && !row["image_key"] && !id) return reply({ error: "Ladda upp en artikelbild innan publicering." }, 400);
          if (id) {
            const { data, error } = await db.from("organizer_articles").update(row as any).eq("id", id).eq("organizer_user_id", c.userId).select("id").maybeSingle();
            return error || !data ? reply({ error: "Artikeln kunde inte sparas." }, 400) : ok({ id });
          }
          const { data, error } = await db.from("organizer_articles").insert({ ...row, organizer_user_id: c.userId } as any).select("id").single();
          if (error) return reply({ error: error.message.includes("quota") ? `Ert ${c.tier === "utokat" ? "paket rymmer högst 5 artiklar" : "grundpaket rymmer en artikel"}.` : "Artikeln kunde inte sparas." }, 400);
          return ok({ id: data.id });
        }

        if (b["action"] === "delete-article") {
          await db.from("organizer_articles").delete().eq("id", String(b["id"] || "")).eq("organizer_user_id", c.userId);
          return ok();
        }

        if (b["action"] === "feature" || b["action"] === "unfeature") {
          const ref = str(b["event_ref"], 80);
          if (!EVENT_REF.test(ref)) return reply({ error: "Ogiltig programpunkt." }, 400);
          if (b["action"] === "unfeature") {
            await db.from("organizer_featured_events").delete().eq("organizer_user_id", c.userId).eq("event_ref", ref);
            return ok();
          }
          if (!(await ownEvent(request, c.name, ref, await eventLinks(c.userId)))) return reply({ error: "Programpunkten tillhör inte er organisation." }, 403);
          const { error } = await db.from("organizer_featured_events").insert({ organizer_user_id: c.userId, event_ref: ref });
          if (error && !error.message.includes("duplicate")) return reply({ error: error.message.includes("quota") ? "Ni har redan lyft så många programpunkter som paketet rymmer." : "Kunde inte spara." }, 400);
          return ok();
        }
        return reply({ error: "invalid" }, 400);
      },
    },
  },
});
