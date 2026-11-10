import { createFileRoute } from "@tanstack/react-router";
import { anonClient, clearCookies, reply, sameOrigin, sessionCookies } from "@/lib/api-session";

// Exchanges a freshly signed-in session for HttpOnly cookies after verifying it server-side.
export const Route = createFileRoute("/api/session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return reply({ error: "Otillåten källa" }, 403);
        let body: { access_token?: unknown; refresh_token?: unknown };
        try { body = await request.json(); } catch { return reply({ error: "Ogiltig data" }, 400); }
        if (typeof body.access_token !== "string" || typeof body.refresh_token !== "string")
          return reply({ error: "Ogiltig session" }, 400);
        const { data } = await anonClient().auth.getUser(body.access_token);
        if (!data.user) return reply({ error: "Ogiltig session" }, 401);
        return reply({ ok: true }, 200, sessionCookies(body.access_token, body.refresh_token));
      },
      DELETE: async ({ request }) => {
        if (!sameOrigin(request)) return reply({ error: "Otillåten källa" }, 403);
        return reply({ ok: true }, 200, clearCookies());
      },
    },
  },
});
