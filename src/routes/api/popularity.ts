import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/api-stub";

// Empty new database: no public hearts yet. Guest hearts are not stored in phase 1.
export const Route = createFileRoute("/api/popularity")({
  server: {
    handlers: {
      GET: async () => json({ counts: {}, updatedAt: Date.now() }, 200, "public, max-age=15, s-maxage=30"),
      POST: async () => json({ error: "Hjärtan sparas inte i förhandsvisningen ännu" }, 503),
    },
  },
});
