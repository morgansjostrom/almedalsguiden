import { createFileRoute } from "@tanstack/react-router";
import { displayName, getSession, reply, sameOrigin } from "@/lib/api-session";

const REF = /^\d+\|\d{4}-\d{2}-\d{2}\|\d{2}:\d{2}$/;

export const Route = createFileRoute("/api/favorites")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const s = await getSession(request);
        if (!s) return reply({ user: null, entries: [] });
        const { data } = await s.db.from("favorites").select("event_ref,saved,updated_at").eq("user_id", s.user.id);
        const entries = (data || []).map((r) => ({ ref: r.event_ref, saved: r.saved, updatedAt: Number(r.updated_at) }));
        return reply({ user: { id: s.user.id, name: displayName(s.user) }, entries }, 200, s.setCookies);
      },
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return reply({ error: "Otillåten källa" }, 403);
        const s = await getSession(request);
        if (!s) return reply({ error: "Inloggning krävs" }, 401);
        const raw = await request.text();
        if (raw.length > 2000000) return reply({ error: "För stor begäran" }, 413);
        let body: { entries?: unknown };
        try { body = JSON.parse(raw); } catch { return reply({ error: "Ogiltig data" }, 400); }
        const entries = body.entries;
        if (!Array.isArray(entries) || entries.length > 10000) return reply({ error: "Ogiltig lista" }, 400);
        const now = Date.now();
        if (entries.some((x) => typeof x?.ref !== "string" || !REF.test(x.ref) || typeof x.saved !== "boolean" || !Number.isSafeInteger(x.updatedAt) || x.updatedAt < 0 || x.updatedAt > now + 300000))
          return reply({ error: "Ogiltig programpunkt" }, 400);
        const { data: existing } = await s.db.from("favorites").select("event_ref,updated_at").eq("user_id", s.user.id);
        const current = new Map((existing || []).map((r) => [r.event_ref, Number(r.updated_at)]));
        // Last write wins per event; tombstones (saved=false) are kept so removals sync.
        const rows = [...new Map(entries.map((x) => [x.ref, x])).values()]
          .filter((x) => !(current.get(x.ref)! >= x.updatedAt))
          .map((x) => ({ user_id: s.user.id, event_ref: x.ref, saved: x.saved, updated_at: x.updatedAt }));
        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await s.db.from("favorites").upsert(rows.slice(i, i + 500));
          if (error) return reply({ error: "Kunde inte spara" }, 500);
        }
        const { data } = await s.db.from("favorites").select("event_ref,saved,updated_at").eq("user_id", s.user.id);
        return reply({ entries: (data || []).map((r) => ({ ref: r.event_ref, saved: r.saved, updatedAt: Number(r.updated_at) })) }, 200, s.setCookies);
      },
    },
  },
});
