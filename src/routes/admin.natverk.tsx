import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/admin/natverk')({
  head: () => ({ meta: [
    { title: 'Nätverksrapporter – Almedalskompassen admin' },
    { name: 'description', content: 'Skyddad hantering av rapporter från Almedalskompassens deltagare.' },
    { property: 'og:title', content: 'Nätverksrapporter – Almedalskompassen admin' },
    { property: 'og:description', content: 'Skyddad hantering av deltagarrapporter.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ], links: [{ rel: 'stylesheet', href: '/auth.css' }, { rel: 'stylesheet', href: '/networking.css?v=2' }] }),
  component: NetworkAdmin,
});
type Report = { id: string; reason: string; snapshot: string; status: string; created_at: string };
function NetworkAdmin() {
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState('Laddar…');
  const [allowed, setAllowed] = useState(false);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  async function load(p: number) {
    try {
      const r = await fetch('/api/networking?mode=admin&page=' + p, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) { setAllowed(false); setMessage(d.error); return; }
      setAllowed(true); setReports(d.reports); setMore(d.more); setMessage('');
    } catch { setMessage('Kunde inte ladda rapporterna.'); }
  }
  useEffect(() => { void load(page); }, [page]);
  async function decide(id: string, decision: string) {
    if (busy || decision === 'suspend' && !confirm('Stäng av nätverkandet för det rapporterade kontot?')) return;
    setBusy(true);
    try {
      const r = await fetch('/api/networking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'moderate', id, decision }) });
      const d = await r.json();
      if (!r.ok) setMessage(d.error); else await load(page);
    } catch { setMessage('Beslutet kunde inte sparas.'); }
    finally { setBusy(false); }
  }
  return <main className="network-admin">
    <a className="auth-brand" href="/schema.html#network"><img src="/compass.svg" width={34} height={34} alt="" />Almedalskompassen</a>
    <h1>Nätverksrapporter</h1><p role="status">{message}</p>
    {!allowed ? <a href="/signin?return_to=%2Fadmin%2Fnatverk">Logga in som admin</a> : <>
      {reports.length === 0 && <p>Inga rapporter.</p>}
      {reports.map(r => <article key={r.id}><h2>{r.status === 'open' ? 'Ny rapport' : 'Hanterad rapport'}</h2><p>{new Date(r.created_at).toLocaleString('sv-SE')}</p><h3>Orsak</h3><p>{r.reason}</p><h3>Rapporterat innehåll</h3><pre>{r.snapshot}</pre>
        {r.status === 'open' && <div className="network-actions"><Button disabled={busy} onClick={() => decide(r.id, 'resolve')}>Markera hanterad</Button><Button disabled={busy} variant="destructive" onClick={() => decide(r.id, 'suspend')}>Stäng av nätverkandet</Button></div>}
      </article>)}
      <div className="network-actions"><Button disabled={!page} variant="outline" onClick={() => setPage(p => p - 1)}>Föregående</Button><Button disabled={!more} variant="outline" onClick={() => setPage(p => p + 1)}>Nästa</Button></div>
    </>}
  </main>;
}