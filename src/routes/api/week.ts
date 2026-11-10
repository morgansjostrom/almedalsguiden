import { createFileRoute } from "@tanstack/react-router";
import { getSession, reply, sameOrigin } from "@/lib/api-session";

const scopeOf = (request: Request) =>
  new URL(request.url).searchParams.get("scope") === "organizer-demo" ? "organizer-demo" : "personal";
const FIELDS = ["firstName", "lastName", "workplace", "role", "description", "goals", "seeking", "offering"] as const;

export const Route = createFileRoute("/api/week")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const s = await getSession(request);
        if (!s) return reply({ error: "Logga in för att använda din profil." }, 401);
        const { data } = await s.db.from("week_profiles").select("data").eq("user_id", s.user.id).eq("scope", scopeOf(request)).maybeSingle();
        return reply({ data: data?.data ?? { profile: {}, feedback: {} } }, 200, s.setCookies);
      },
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return reply({ error: "Otillåten källa" }, 403);
        const s = await getSession(request);
        if (!s) return reply({ error: "Inloggning krävs" }, 401);
        const raw = await request.text();
        if (raw.length > 300000) return reply({ error: "För mycket data" }, 413);
        let d: any;
        try { d = JSON.parse(raw); } catch { return reply({ error: "Ogiltig data" }, 400); }
        const p = d?.profile;
        if (!p || typeof p !== "object" || !d.feedback || typeof d.feedback !== "object" || Array.isArray(d.feedback)) return reply({ error: "Ogiltig profil" }, 400);
        for (const n of FIELDS) if (typeof p[n] !== "string" || p[n].length > 3000) return reply({ error: "Kontrollera profilfälten" }, 400);
        if (!Array.isArray(p.interests) || p.interests.length > 100 || p.interests.some((v: unknown) => typeof v !== "string" || v.length > 100) || typeof p.visible !== "boolean") return reply({ error: "Ogiltiga intressen" }, 400);
        for (const [k, v] of Object.entries(d.feedback) as [string, any][])
          if (!/^\d+\|\d{4}-\d{2}-\d{2}\|\d{2}:\d{2}$/.test(k) || !v || !["yes", "no"].includes(v.vote) || !["", "subject", "time", "level"].includes(v.reason)) return reply({ error: "Ogiltig återkoppling" }, 400);
        const clean = { profile: Object.fromEntries([...FIELDS, "interests", "visible"].map((k) => [k, p[k]])), feedback: d.feedback };
        const { error } = await s.db.from("week_profiles").upsert({ user_id: s.user.id, scope: scopeOf(request), data: clean, updated_at: Date.now() });
        if (error) return reply({ error: "Kunde inte spara" }, 500);
        return reply({ ok: true }, 200, s.setCookies);
      },
    },
  },
});
