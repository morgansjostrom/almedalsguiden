import { createFileRoute } from '@tanstack/react-router';
import { getSession, reply, sameOrigin } from '@/lib/api-session';
import { PROFILE_PHOTO_LIMIT, validProfilePhoto } from '@/lib/profile-photo';

export const Route = createFileRoute('/api/profile-photo')({
  server: { handlers: {
    GET: async ({ request }) => {
      const s = await getSession(request);
      if (!s) return reply({ error: 'Inloggning krävs.' }, 401);
      const id = new URL(request.url).searchParams.get('id') || s.user.id;
      if (!/^[a-f0-9-]{36}$/.test(id)) return reply({ error: 'Ogiltig profil.' }, 400);
      let storage = s.db.storage;
      if (id !== s.user.id) {
        const allowed = await s.db.rpc('network_allowed', { u: s.user.id });
        if (!allowed.data) return reply({ error: 'Ingen åtkomst.' }, 403);
        const profile = await s.db.from('network_profiles').select('user_id').eq('user_id', id).eq('visible', true).eq('suspended', false).maybeSingle();
        if (!profile.data || profile.error) return reply({ error: 'Foto saknas.' }, 404);
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const consent = await supabaseAdmin.from('network_consents').select('version,granted').eq('user_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (consent.error || !consent.data?.granted || consent.data.version !== 'network-v2') return reply({ error: 'Foto saknas.' }, 404);
        storage = supabaseAdmin.storage;
      }
      // Check live object metadata before downloading: storage caches may retain a deleted image.
      const objects = await storage.from('profile-photos').list(id, { search: 'profile.jpg', limit: 1 });
      if (objects.error || !objects.data?.some(object => object.name === 'profile.jpg')) return reply({ error: 'Foto saknas.' }, 404);
      const photo = await storage.from('profile-photos').download(id + '/profile.jpg');
      if (photo.error || !photo.data) return reply({ error: 'Foto saknas.' }, 404);
      const headers = new Headers({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      s.setCookies.forEach(c => headers.append('Set-Cookie', c));
      return new Response(photo.data, { headers });
    },
    POST: async ({ request }) => {
      if (!sameOrigin(request)) return reply({ error: 'Otillåten källa.' }, 403);
      const s = await getSession(request);
      if (!s) return reply({ error: 'Inloggning krävs.' }, 401);
      if (Number(request.headers.get('content-length')) > PROFILE_PHOTO_LIMIT) return reply({ error: 'Fotot är för stort.' }, 413);
      const bytes = new Uint8Array(await request.arrayBuffer());
      if (!validProfilePhoto(bytes, request.headers.get('content-type') || '')) return reply({ error: 'Välj ett giltigt foto.' }, 400);
      const result = await s.db.storage.from('profile-photos').upload(s.user.id + '/profile.jpg', bytes, { contentType: 'image/jpeg', upsert: true });
      return reply(result.error ? { error: 'Fotot kunde inte sparas.' } : { ok: true }, result.error ? 500 : 200, s.setCookies);
    },
    DELETE: async ({ request }) => {
      if (!sameOrigin(request)) return reply({ error: 'Otillåten källa.' }, 403);
      const s = await getSession(request);
      if (!s) return reply({ error: 'Inloggning krävs.' }, 401);
      const result = await s.db.storage.from('profile-photos').remove([s.user.id + '/profile.jpg']);
      return reply(result.error ? { error: 'Fotot kunde inte tas bort.' } : { ok: true }, result.error ? 500 : 200, s.setCookies);
    },
  } },
});