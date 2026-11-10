import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/api-stub";

// No database rows imported; pages fall back to the static public/speaker-profiles.json.
export const Route = createFileRoute("/api/speaker-profiles")({
  server: { handlers: { GET: async () => json({ people: [] }) } },
});
