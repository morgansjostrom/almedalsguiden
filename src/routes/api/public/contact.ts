import { createFileRoute } from '@tanstack/react-router';
import { contactSchema, CONTACT_RECIPIENT } from '@/lib/contact';

// Fail closed until the owner's sending domain is configured and a fixed
// contact email template is scaffolded. Never acknowledge an unsent email.
export const Route = createFileRoute('/api/public/contact')({
  server: { handlers: { POST: async ({ request }) => {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) {
      return Response.json({ error: 'Förfrågan kunde inte godkännas.' }, { status: 403 });
    }
    if (!request.headers.get('content-type')?.startsWith('application/json')) {
      return Response.json({ error: 'Kontrollera formuläret.' }, { status: 415 });
    }
    const body = await request.text();
    if (body.length > 4096) return Response.json({ error: 'Formuläret är för stort.' }, { status: 413 });
    let input: unknown;
    try { input = JSON.parse(body); } catch { return Response.json({ error: 'Kontrollera formuläret.' }, { status: 400 }); }
    if (!contactSchema.safeParse(input).success) return Response.json({ error: 'Fyll i namn, företag och en giltig e-postadress.' }, { status: 400 });
    return Response.json({ error: `Formuläret kan inte skicka ännu. Mejla oss på ${CONTACT_RECIPIENT}.` }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  } } },
});