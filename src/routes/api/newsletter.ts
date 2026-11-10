import { createFileRoute } from "@tanstack/react-router";
import { getSession, reply, sameOrigin } from "@/lib/api-session";

// Stores consent only. No emails are sent from this environment.
export const Route = createFileRoute("/api/newsletter")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const s = await getSession(request);
        if (!s) return reply({ user: null, subscribed: false });
        const { data } = await s.db.from("newsletter_subscriptions").select("subscribed").eq("user_id", s.user.id).maybeSingle();
        return reply({ user: { email: s.user.email }, subscribed: data?.subscribed ?? false }, 200, s.setCookies);
      },
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return reply({ error: "Otillåten källa." }, 403);
        const s = await getSession(request);
        if (!s) return reply({ error: "Logga in för att spara ditt val." }, 401);
        const raw = await request.text();
        if (raw.length > 1000) return reply({ error: "För stor begäran." }, 413);
        let body: { subscribed?: unknown };
        try { body = JSON.parse(raw); } catch { return reply({ error: "Ogiltig begäran." }, 400); }
        if (typeof body?.subscribed !== "boolean") return reply({ error: "Välj om du vill prenumerera." }, 400);
        const { error } = await s.db.from("newsletter_subscriptions").upsert({
          user_id: s.user.id, email: s.user.email || "", subscribed: body.subscribed,
          consent_version: "program-updates-v1", updated_at: Date.now(),
        });
        if (error) return reply({ error: "Kunde inte spara." }, 500);
        return reply({ subscribed: body.subscribed }, 200, s.setCookies);
      },
    },
  },
});
