import { createFileRoute } from "@tanstack/react-router";
import { anonClient, getSession, reply, sameOrigin, sessionCookies } from "@/lib/api-session";
import { validNewPassword } from "@/lib/organizer-accounts";

// The signed-in organizer replaces the temporary password from the invoice.
export const Route = createFileRoute("/api/organizer-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return reply({ error: "forbidden" }, 403);
        const s = await getSession(request);
        if (!s) return reply({ error: "signed_out" }, 401);
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const password = body["password"];
        if (!validNewPassword(password)) return reply({ error: "weak" }, 400);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.auth.admin.updateUserById(s.user.id, { password });
        if (error) return reply({ error: error.message.includes("same") ? "same" : "failed" }, 400);
        await supabaseAdmin.from("organizer_accounts").update({ must_change_password: false, updated_at: new Date().toISOString() }).eq("user_id", s.user.id);
        // Changing the password ends existing sessions; sign in again with the new one.
        const { data: fresh } = await anonClient().auth.signInWithPassword({ email: s.user.email || "", password });
        const cookies = fresh.session ? sessionCookies(fresh.session.access_token, fresh.session.refresh_token) : s.setCookies;
        return reply({ ok: true, relogin: !!fresh.session }, 200, cookies);
      },
    },
  },
});
