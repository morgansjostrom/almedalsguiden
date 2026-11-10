import { createFileRoute } from "@tanstack/react-router";
import { anonClient, getSession, isEditor, reply, sameOrigin } from "@/lib/api-session";

const slug = "almedalskompassen";
const demo = {
  slug,
  name: "Almedalskompassen",
  active: true,
  demo: true,
  description:
    "Testarrangör som administratören använder för att prova arrangörsverktyget. Lägg till beskrivning, logga och kontaktuppgifter via redigeringsformuläret.",
  logo: "/compass.svg",
  cover: "",
  website: "",
  email: "",
};
const withDefaultLogo = (p: Record<string, unknown>) => ({ ...p, logo: p["logo"] || (!p["logoConfigured"] ? demo.logo : "") });

export const Route = createFileRoute("/api/organizers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const s = await getSession(request);
        const { data } = await (s?.db ?? anonClient()).from("organizer_profiles").select("slug,data");
        const profiles = (data || []).map((r) => (r.slug === slug ? withDefaultLogo(r.data as Record<string, unknown>) : r.data));
        if (!(data || []).some((r) => r.slug === slug)) profiles.push(demo);
        return reply({ profiles, canEdit: await isEditor(s) }, 200, s?.setCookies ?? []);
      },
      POST: async ({ request }) => {
        const s = await getSession(request);
        if (!sameOrigin(request) || !(await isEditor(s))) return reply({ error: "Endast administratören kan redigera profilen." }, 403);
        const raw = await request.text();
        if (raw.length > 16000) return reply({ error: "För stor profil." }, 413);
        let b: any;
        try { b = JSON.parse(raw); } catch { return reply({ error: "Ogiltig profil." }, 400); }
        if (!b || typeof b.name !== "string" || !b.name.trim() || b.name.length > 120 || typeof b.description !== "string" || b.description.length > 5000 || typeof b.active !== "boolean") return reply({ error: "Kontrollera namn och presentation." }, 400);
        for (const k of ["logo", "cover", "website", "email"]) if (typeof b[k] !== "string" || b[k].length > 500) return reply({ error: "Kontrollera kontaktuppgifter och bilder." }, 400);
        for (const k of ["logo", "cover"]) if (b[k] && b[k] !== "/compass.svg" && !/^\/api\/organizer-assets\?key=organizers%2F[a-f0-9-]+\.(png|jpg|webp)$/.test(b[k])) return reply({ error: "Ladda upp bilden via formuläret." }, 400);
        if (b.website) { try { if (new URL(b.website).protocol !== "https:") throw Error(); } catch { return reply({ error: "Webbplatsen måste börja med https://." }, 400); } }
        if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) return reply({ error: "Kontrollera e-postadressen." }, 400);
        const profile = { ...demo, logoConfigured: true, name: b.name.trim(), description: b.description.trim(), active: b.active, logo: b.logo, cover: b.cover, website: b.website, email: b.email };
        const { error } = await s!.db.from("organizer_profiles").upsert({ slug, data: profile, updated_at: Date.now() });
        if (error) return reply({ error: "Kunde inte spara profilen." }, 500);
        return reply({ profile }, 200, s!.setCookies);
      },
    },
  },
});
