import { createFileRoute } from "@tanstack/react-router";
import { getSession, isEditor, reply, sameOrigin } from "@/lib/api-session";
import { EVENT_REF, slugify, validSlug } from "@/lib/organizer-packages";
import { accessPeriod, tempPassword } from "@/lib/organizer-accounts";

// Admin-only: create invoice-paid organizer accounts with a temporary password,
// renew access one year, issue a new temporary password, or switch access off.
export const Route = createFileRoute("/api/admin-organizers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const s = await getSession(request);
        if (!(await isEditor(s))) return reply({ error: "forbidden" }, 403);
        const [{ data, error }, links] = await Promise.all([
          s!.db.from("organizer_accounts").select("*").order("created_at", { ascending: false }),
          s!.db.from("organizer_event_links").select("organizer_user_id,event_ref,mode"),
        ]);
        if (error) return reply({ error: "read_failed" }, 500);
        return reply({ accounts: data, links: links.data || [] }, 200, s!.setCookies);
      },
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return reply({ error: "forbidden" }, 403);
        const s = await getSession(request);
        if (!(await isEditor(s))) return reply({ error: "forbidden" }, 403);
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const action = body["action"];

        if (action === "create") {
          const email = String(body["email"] || "").trim().toLowerCase();
          const name = String(body["organizer_name"] || "").trim();
          const start = body["starts_at"] ? new Date(String(body["starts_at"])) : new Date();
          const tier = body["package_tier"] === "utokat" ? "utokat" : "grund";
          const slug = String(body["slug"] || slugify(name));
          if (!validSlug(slug)) return reply({ error: "slug" }, 400);
          const { data: taken } = await supabaseAdmin.from("organizer_accounts").select("user_id").eq("slug", slug).maybeSingle();
          if (taken) return reply({ error: "slug_taken" }, 400);
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name || isNaN(start.getTime())) return reply({ error: "invalid" }, 400);
          const password = tempPassword();
          const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
          if (error || !data.user) return reply({ error: error?.message?.includes("already") ? "exists" : "create_failed" }, 400);
          const { error: e2 } = await supabaseAdmin.from("organizer_accounts").insert({
            user_id: data.user.id, email, organizer_name: name, package_tier: tier, slug, must_change_password: true, active: true, ...accessPeriod(start),
          });
          if (e2) { await supabaseAdmin.auth.admin.deleteUser(data.user.id); return reply({ error: "create_failed" }, 500); }
          return reply({ ok: true, email, password });
        }

        const userId = String(body["user_id"] || "");
        const { data: acc } = await supabaseAdmin.from("organizer_accounts").select("*").eq("user_id", userId).maybeSingle();
        if (!acc) return reply({ error: "not_found" }, 404);
        const now = new Date().toISOString();

        if (action === "tier") {
          const tier = body["package_tier"] === "utokat" ? "utokat" : "grund";
          await supabaseAdmin.from("organizer_accounts").update({ package_tier: tier, updated_at: now }).eq("user_id", userId);
          return reply({ ok: true });
        }
        if (action === "aliases") {
          const list = Array.isArray(body["aliases"]) ? body["aliases"] : [];
          const aliases = [...new Set(list.map((a) => String(a).trim().slice(0, 150)).filter(Boolean))].slice(0, 20);
          await supabaseAdmin.from("organizer_accounts").update({ aliases, updated_at: now }).eq("user_id", userId);
          return reply({ ok: true });
        }
        if (action === "link") {
          const ref = String(body["event_ref"] || "");
          const mode = body["mode"];
          if (!EVENT_REF.test(ref)) return reply({ error: "invalid" }, 400);
          if (mode === "include" || mode === "exclude") {
            await supabaseAdmin.from("organizer_event_links").upsert({ organizer_user_id: userId, event_ref: ref, mode });
          } else {
            await supabaseAdmin.from("organizer_event_links").delete().eq("organizer_user_id", userId).eq("event_ref", ref);
          }
          return reply({ ok: true });
        }
        if (action === "renew") {
          const from = new Date(acc.expires_at) > new Date() ? new Date(acc.expires_at) : new Date();
          const end = new Date(from); end.setUTCFullYear(end.getUTCFullYear() + 1);
          await supabaseAdmin.from("organizer_accounts").update({ expires_at: end.toISOString(), active: true, updated_at: now }).eq("user_id", userId);
          return reply({ ok: true });
        }
        if (action === "reset") {
          const password = tempPassword();
          const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
          if (error) return reply({ error: "reset_failed" }, 500);
          await supabaseAdmin.from("organizer_accounts").update({ must_change_password: true, updated_at: now }).eq("user_id", userId);
          return reply({ ok: true, email: acc.email, password });
        }
        if (action === "deactivate" || action === "activate") {
          await supabaseAdmin.from("organizer_accounts").update({ active: action === "activate", updated_at: now }).eq("user_id", userId);
          return reply({ ok: true });
        }
        return reply({ error: "invalid" }, 400);
      },
    },
  },
});
