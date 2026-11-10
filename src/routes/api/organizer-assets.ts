import { createFileRoute } from "@tanstack/react-router";

// No file storage connected yet; R2 originals are not migrated (inventory missing).
export const Route = createFileRoute("/api/organizer-assets")({
  server: {
    handlers: {
      GET: async () => new Response("Not found", { status: 404 }),
      POST: async () => new Response("Forbidden", { status: 403 }),
    },
  },
});
