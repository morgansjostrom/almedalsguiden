import { createFileRoute } from "@tanstack/react-router";
import { getSession, reply, sameOrigin } from "@/lib/api-session";
import { organizerContext } from "@/lib/organizer-content.server";
import { validProfilePhoto } from "@/lib/profile-photo";

const KEY = /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.jpg$/;
const LIMIT = 3 * 1024 * 1024;

// Logos and article images for organizer pages. Images are public content once used,
// keys are random. Uploads only by a verified organizer into their own folder.
export const Route = createFileRoute("/api/organizer-media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key") || "";
        if (!KEY.test(key)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const file = await supabaseAdmin.storage.from("organizer-media").download(key);
        if (file.error || !file.data) return new Response("Not found", { status: 404 });
        return new Response(file.data, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" } });
      },
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return reply({ error: "forbidden" }, 403);
        const s = await getSession(request);
        const c = await organizerContext(s);
        if (!c) return reply({ error: "forbidden" }, 403);
        if (Number(request.headers.get("content-length")) > LIMIT) return reply({ error: "Bilden är för stor." }, 413);
        const bytes = new Uint8Array(await request.arrayBuffer());
        if (bytes.length > LIMIT || !validProfilePhoto(bytes, request.headers.get("content-type") || "")) return reply({ error: "Välj en giltig bild." }, 400);
        const key = `${c.userId}/${crypto.randomUUID()}.jpg`;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const up = await supabaseAdmin.storage.from("organizer-media").upload(key, bytes, { contentType: "image/jpeg" });
        return up.error ? reply({ error: "Bilden kunde inte sparas." }, 500) : reply({ key }, 200, s!.setCookies);
      },
    },
  },
});
