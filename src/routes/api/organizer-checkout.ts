import { createFileRoute } from "@tanstack/react-router";
import { reply } from "@/lib/api-session";

// Card payment was removed (2026-10-27): organizers pay by invoice and get a temporary password.
export const Route = createFileRoute("/api/organizer-checkout")({
  server: { handlers: { POST: async () => reply({ error: "invoice_only" }, 410) } },
});
