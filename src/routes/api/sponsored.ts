import { createFileRoute } from "@tanstack/react-router";
import { reply } from "@/lib/api-session";
import { mediaUrl } from "@/lib/organizer-content.server";
import { slugify } from "@/lib/organizer-packages";

// Public: published sponsored articles and featured events of organizers with valid access.
export const Route = createFileRoute("/api/sponsored")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();
        const [accs, admins] = await Promise.all([
          db.from("organizer_accounts").select("user_id,organizer_name,slug").eq("active", true).lte("starts_at", now).gt("expires_at", now),
          db.from("user_roles").select("user_id").eq("role", "admin"),
        ]);
        const owners = new Map<string, { name: string; slug: string }>();
        for (const a of admins.data || []) owners.set(a.user_id, { name: "Almedalskompassen", slug: "almedalskompassen" });
        for (const a of accs.data || []) owners.set(a.user_id, { name: a.organizer_name, slug: a.slug || slugify(a.organizer_name) });
        const ids = [...owners.keys()];
        if (!ids.length) return reply({ articles: [], featured: [] }, 200, [], "public, max-age=60");
        const [arts, feats] = await Promise.all([
          db.from("organizer_articles").select("id,organizer_user_id,title,lead,body,image_key,event_ref,subjects,updated_at").eq("status", "published").in("organizer_user_id", ids),
          db.from("organizer_featured_events").select("event_ref,organizer_user_id").in("organizer_user_id", ids),
        ]);
        return reply({
          articles: (arts.data || []).map((a) => ({ id: "org-" + a.id, title: a.title, lead: a.lead, body: a.body, image: mediaUrl(a.image_key), eventRef: a.event_ref, subjects: a.subjects, sender: owners.get(a.organizer_user_id)!.name, slug: owners.get(a.organizer_user_id)!.slug })),
          featured: (feats.data || []).map((f) => f.event_ref),
        }, 200, [], "public, max-age=60");
      },
    },
  },
});
