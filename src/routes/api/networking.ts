import { createFileRoute } from '@tanstack/react-router';
import { getSession, isEditor, reply, sameOrigin } from '@/lib/api-session';
import { networkCommandSchema, networkQuerySchema, PROFILE_FIELDS } from '@/lib/networking';

export const Route = createFileRoute('/api/networking')({
  server: { handlers: {
    GET: async ({ request }) => {
      const s = await getSession(request);
      if (!s) return reply({ error: 'Logga in för att nätverka.' }, 401);
      const allowed = await s.db.rpc('network_allowed', { u: s.user.id });
      if (allowed.error) return reply({ error: 'Nätverkandet kunde inte laddas.' }, 503, s.setCookies);
      if (!allowed.data) return reply({ enabled: false, error: 'Nätverkande är ännu inte öppet för besökare.' }, 403, s.setCookies);
      const parsed = networkQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
      if (!parsed.success) return reply({ error: 'Ogiltig sökning.' }, 400, s.setCookies);
      const { mode, q, day, page, id } = parsed.data;
      const fail = () => reply({ error: 'Kunde inte ladda. Försök igen.' }, 500, s.setCookies);
      if (mode === 'admin') {
        if (!await isEditor(s)) return reply({ error: 'Ingen behörighet.' }, 403, s.setCookies);
        const result = await s.db.from('network_reports').select('*').order('created_at', { ascending: false }).range(page * 30, page * 30 + 30);
        return result.error ? fail() : reply({ reports: result.data.slice(0, 30), more: result.data.length > 30 }, 200, s.setCookies);
      }
      if (mode === 'directory') {
        let query = s.db.from('network_profiles').select(PROFILE_FIELDS).eq('visible', true).eq('suspended', false).neq('user_id', s.user.id);
        if (q) {
          // SQL filters are not interpolated from arbitrary PostgREST syntax.
          const term = q.replace(/[^\p{L}\p{N}\s-]/gu, '').trim();
          if (!term) return reply({ profiles: [], more: false }, 200, s.setCookies);
          query = query.or(`name.ilike.%${term}%,organization.ilike.%${term}%,role.ilike.%${term}%,interests.cs.{${term}}`);
        }
        if (day) query = query.contains('days', [day]);
        const result = await query.order('name').order('user_id').range(page * 20, page * 20 + 20);
        if (result.error) return fail();
        const profiles = result.data.slice(0, 20);
        const extra = profiles.length ? await s.db.rpc('network_match_data', { targets: profiles.map(p => p.user_id) }) : { data: [], error: null };
        if (extra.error) return fail();
        const links = profiles.length ? await s.db.rpc('network_linkedin_data', { targets: profiles.map(p => p.user_id) }) : { data: [], error: null };
        if (links.error) return fail();
        const linkById = new Map((links.data || []).map(l => [l.user_id, l.linkedin]));
        const byId = new Map((extra.data || []).map(m => [m.user_id, m]));
        return reply({ profiles: profiles.map(p => ({ ...p, seeking_tags: byId.get(p.user_id)?.seeking || [], offering_tags: byId.get(p.user_id)?.offering || [], shared_events: byId.get(p.user_id)?.shared_events?.length || 0, linkedin: linkById.get(p.user_id) || '' })), more: result.data.length > 20 }, 200, s.setCookies);
      }
      if (mode === 'messages' && id) {
        const contact = await s.db.from('network_requests').select('*').eq('id', id).eq('status', 'accepted').maybeSingle();
        if (contact.error) return fail();
        if (!contact.data) return reply({ error: 'Samtalet är inte tillgängligt.' }, 404, s.setCookies);
        const result = await s.db.from('network_messages').select('*').eq('request_id', id).order('created_at', { ascending: false }).order('id').range(page * 30, page * 30 + 30);
        return result.error ? fail() : reply({ messages: result.data.slice(0, 30).reverse(), more: result.data.length > 30 }, 200, s.setCookies);
      }
      const [own, contacts, blocks, admin, prefs] = await Promise.all([
        s.db.from('network_profiles').select('*').eq('user_id', s.user.id).maybeSingle(),
        s.db.from('network_requests').select('*').order('updated_at', { ascending: false }).range(page * 30, page * 30 + 30),
        s.db.from('network_blocks').select('target_id').eq('owner_id', s.user.id),
        isEditor(s),
        s.db.from('network_match_prefs').select('seeking,offering,share_schedule,linkedin').eq('user_id', s.user.id).maybeSingle(),
      ]);
      if (prefs.error) return fail();
      const profile = own.data ? { ...own.data, seeking_tags: prefs.data?.seeking || [], offering_tags: prefs.data?.offering || [], share_schedule: !!prefs.data?.share_schedule, linkedin: prefs.data?.linkedin || '' } : null;
      if (own.error || contacts.error || blocks.error) return fail();
      const ids = [...new Set(contacts.data.flatMap(r => [r.sender_id, r.recipient_id]).filter(u => u !== s.user.id))];
      const names = ids.length ? await s.db.from('network_profiles').select('user_id,name,organization').in('user_id', ids) : { data: [], error: null };
      if (names.error) return fail();
      return reply({ enabled: true, userId: s.user.id, profile, contacts: contacts.data.slice(0, 30), more: contacts.data.length > 30, people: names.data, blocks: blocks.data, admin }, 200, s.setCookies);
    },
    POST: async ({ request }) => {
      if (!sameOrigin(request)) return reply({ error: 'Otillåten källa.' }, 403);
      const s = await getSession(request);
      if (!s) return reply({ error: 'Logga in för att nätverka.' }, 401);
      const raw = await request.text();
      if (raw.length > 20000) return reply({ error: 'För mycket data.' }, 413, s.setCookies);
      let body: unknown;
      try { body = JSON.parse(raw); } catch { return reply({ error: 'Ogiltiga uppgifter.' }, 400, s.setCookies); }
      const parsed = networkCommandSchema.safeParse(body);
      if (!parsed.success) return reply({ error: 'Kontrollera fälten och medgivandet.' }, 400, s.setCookies);
      if (parsed.data.action === 'match') {
        const m = parsed.data;
        const r = await s.db.rpc('network_set_match', { seeking: m.seeking, offering: m.offering, share_schedule: m.share_schedule });
        if (!r.error && m.linkedin !== undefined) {
          const l = await s.db.rpc('network_set_linkedin', { url: m.linkedin });
          if (l.error) return reply({ error: 'LinkedIn-länken kunde inte sparas.' }, 400, s.setCookies);
        }
        return r.error ? reply({ error: 'Matchningsvalen kunde inte sparas.' }, 400, s.setCookies) : reply({ ok: true }, 200, s.setCookies);
      }
      const { action, ...payload } = parsed.data;
      const { data, error } = await s.db.rpc('network_command', { action, payload });
      if (error) return reply({ error: error.code === 'P0001' ? error.message : 'Åtgärden kunde inte genomföras.' }, 400, s.setCookies);
      return reply(data, 200, s.setCookies);
    },
  } },
});