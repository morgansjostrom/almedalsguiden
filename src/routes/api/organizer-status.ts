import { createFileRoute } from "@tanstack/react-router";
import { getSession, reply } from "@/lib/api-session";

// Organizer access = admin, approved organizer role, or an active invoice-paid account (one year).
export const Route = createFileRoute("/api/organizer-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const s = await getSession(request);
        if (!s) return reply({ user: null, organizer: false, admin: false });
        const [a, o, acc, row] = await Promise.all([
          s.db.rpc("has_role", { _user_id: s.user.id, _role: "admin" }),
          s.db.rpc("has_role", { _user_id: s.user.id, _role: "organizer" }),
          s.db.rpc("has_organizer_access", { _user_id: s.user.id }),
          s.db.from("organizer_accounts").select("organizer_name,expires_at,must_change_password").eq("user_id", s.user.id).maybeSingle(),
        ]);
        return reply({
          user: { email: s.user.email },
          organizer: !!(a.data || o.data || acc.data),
          admin: !!a.data,
          organizerName: row.data?.organizer_name ?? null,
          expiresAt: row.data?.expires_at ?? null,
          mustChangePassword: !!row.data?.must_change_password,
        }, 200, s.setCookies);
      },
    },
  },
});
