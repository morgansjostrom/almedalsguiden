import { createFileRoute } from "@tanstack/react-router";
import { json, sameOrigin } from "@/lib/api-stub";

export const Route = createFileRoute("/api/speaker-reports")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        sameOrigin(request)
          ? json({ error: "Rapporter tas inte emot i förhandsvisningen ännu." }, 503)
          : json({ error: "Otillåten källa" }, 403),
    },
  },
});
