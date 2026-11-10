import { createFileRoute } from "@tanstack/react-router";
import { PACKAGE_LABEL, ownsEvent, slugify, type PackageTier } from "@/lib/organizer-packages";
import { useCallback, useEffect, useState, type FormEvent } from "react";

export const Route = createFileRoute("/admin/arrangorer")({
  head: () => ({
    meta: [
      { title: "Admin: arrangörskonton – Almedalskompassen" },
      { name: "description", content: "Skyddad administration av arrangörskonton." },
      { property: "og:title", content: "Admin: arrangörskonton – Almedalskompassen" },
      { property: "og:description", content: "Skyddad administration av arrangörskonton." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: "/auth.css" }, { rel: "stylesheet", href: "/admin.css" }],
  }),
  component: Admin,
});

type Link = { organizer_user_id: string; event_ref: string; mode: string };
type Ev = { id: string | number; day: string; start: string; end?: string; title: string; organizer?: string };
type Account = { aliases?: string[]; user_id: string; email: string; organizer_name: string; starts_at: string; expires_at: string; must_change_password: boolean; active: boolean; package_tier: string; slug: string | null };
const day = (s: string) => new Date(s).toLocaleDateString("sv-SE");

function Admin() {
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [tier, setTier] = useState("grund");
  const [slug, setSlug] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin-organizers", { cache: "no-store" });
    if (r.status === 403) return setState("denied");
    const d = await r.json();
    setAccounts(d.accounts || []); setLinks(d.links || []); setState("ok");
  }, []);
  useEffect(() => { load(); }, [load]);

  async function post(body: object) {
    setMsg("");
    const r = await fetch("/api/admin-organizers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setMsg(d.error === "exists" ? "Det finns redan ett konto med den e-postadressen." : d.error === "slug_taken" ? "Adressen till arrangörssidan används redan." : d.error === "slug" ? "Adressen får bara innehålla a–z, siffror och bindestreck." : "Något gick fel. Försök igen.");
    if (d.password) setIssued({ email: d.email, password: d.password });
    await load();
    return r.ok;
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (await post({ action: "create", email, organizer_name: name, starts_at: start, package_tier: tier, slug: slug || slugify(name) })) { setEmail(""); setName(""); setSlug(""); }
  }

  if (state === "loading") return <main className="auth-wrap"><p>Laddar…</p></main>;
  if (state === "denied") return (
    <main className="auth-wrap"><section className="auth-card"><h1>Ingen behörighet</h1><p>Sidan kräver adminbehörighet.</p>
      <a className="auth-primary admin-link" href="/signin?return_to=%2Fadmin%2Farrangorer">Logga in</a></section></main>
  );

  const now = new Date();
  return (
    <main className="admin-wrap">
      <a className="auth-brand" href="/index.html"><img src="/compass.svg" alt="" width={34} height={34} /> Almedalskompassen</a>
      <h1>Arrangörskonton</h1>
      <p className="admin-intro">Skapa ett konto när fakturan skickas. Skicka det tillfälliga lösenordet med fakturan – arrangören väljer ett eget vid första inloggningen. Åtkomsten gäller ett år från startdatum.</p>

      <form className="admin-card admin-form" onSubmit={create}>
        <h2>Nytt arrangörskonto</h2>
        <label>Arrangörens namn<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>E-post (fakturamottagare)<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Paket<select value={tier} onChange={(e) => setTier(e.target.value)}><option value="grund">Grundpaket – 1 artikel, 1 lyft programpunkt</option><option value="utokat">Utökat paket – upp till 5 artiklar och 5 lyfta programpunkter</option></select></label>
        <label>Adress till arrangörssidan<input value={slug} placeholder={slugify(name) || "foretagsnamn"} onChange={(e) => setSlug(e.target.value.toLowerCase())} /></label>
        <label>Startdatum<input type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <button className="auth-primary">Skapa konto och tillfälligt lösenord</button>
      </form>

      {msg && <p className="auth-msg" role="status">{msg}</p>}
      {issued && (
        <div className="admin-card admin-issued" role="status">
          <h2>Tillfälligt lösenord</h2>
          <p>Visas bara nu. Skicka det med fakturan.</p>
          <dl><dt>E-post</dt><dd>{issued.email}</dd><dt>Lösenord</dt><dd><code>{issued.password}</code></dd><dt>Inloggning</dt><dd>{location.origin}/arrangor-start.html</dd></dl>
          <button type="button" className="auth-google" onClick={() => navigator.clipboard?.writeText(`Inloggning: ${location.origin}/arrangor-start.html\nE-post: ${issued.email}\nTillfälligt lösenord: ${issued.password}`)}>Kopiera text till fakturan</button>
        </div>
      )}

      <section className="admin-card">
        <h2>Alla konton ({accounts.length})</h2>
        {accounts.length === 0 && <p>Inga arrangörskonton ännu.</p>}
        <ul className="admin-list">
          {accounts.map((a) => {
            const on = a.active && new Date(a.starts_at) <= now && new Date(a.expires_at) > now;
            return (
              <li key={a.user_id}>
                <div><b>{a.organizer_name}</b><span>{a.email}</span>
                  <span>{on ? "Aktiv" : a.active ? "Ej aktiv (utanför perioden)" : "Avstängd"} · {day(a.starts_at)} – {day(a.expires_at)}{a.must_change_password ? " · har inte bytt lösenord" : ""}</span>
                  <span>{PACKAGE_LABEL[(a.package_tier as PackageTier)] ?? "Grundpaket"} · /{a.slug || slugify(a.organizer_name)}</span></div>
                <div className="admin-actions">
                  <button type="button" onClick={() => post({ action: "tier", user_id: a.user_id, package_tier: a.package_tier === "utokat" ? "grund" : "utokat" })}>{a.package_tier === "utokat" ? "Byt till Grundpaket" : "Byt till Utökat paket"}</button>
                  <button type="button" onClick={() => setOpenId(openId === a.user_id ? null : a.user_id)}>{openId === a.user_id ? "Stäng programpunkter" : "Programpunkter"}</button>
                  <button type="button" onClick={() => post({ action: "renew", user_id: a.user_id })}>Förläng ett år</button>
                  <button type="button" onClick={() => post({ action: "reset", user_id: a.user_id })}>Nytt tillfälligt lösenord</button>
                  <button type="button" onClick={() => post({ action: a.active ? "deactivate" : "activate", user_id: a.user_id })}>{a.active ? "Stäng av" : "Aktivera"}</button>
                </div>
                {openId === a.user_id && <EventsPanel account={a} links={links.filter((l) => l.organizer_user_id === a.user_id)} post={post} />}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

const evRef = (e: Ev) => [e.id, e.day, e.start].join("|");

function EventsPanel({ account, links, post }: { account: Account; links: Link[]; post: (b: object) => Promise<boolean> }) {
  const [years, setYears] = useState<Record<string, { file: string }>>({});
  const [year, setYear] = useState("");
  const [rows, setRows] = useState<Ev[]>([]);
  const [q, setQ] = useState("");
  const [aliases, setAliases] = useState((account.aliases || []).join(", "));
  useEffect(() => {
    fetch("/program-runtime/manifest.json").then((r) => r.json()).then((m) => {
      setYears(m.byYear || {});
      setYear(Object.keys(m.byYear || {}).sort().pop() || "");
    });
  }, []);
  useEffect(() => { if (years[year]) fetch(years[year].file).then((r) => r.json()).then(setRows); }, [year, years]);
  const ov = {
    aliases: account.aliases || [],
    include: links.filter((l) => l.mode === "include").map((l) => l.event_ref),
    exclude: links.filter((l) => l.mode === "exclude").map((l) => l.event_ref),
  };
  const mode = (e: Ev) => links.find((l) => l.event_ref === evRef(e))?.mode;
  const auto = (e: Ev) => ownsEvent(e, account.organizer_name, { aliases: ov.aliases });
  const relevant = rows.filter((e) => auto(e) || mode(e));
  const needle = q.trim().toLocaleLowerCase("sv-SE");
  const hits = needle.length < 3 ? [] : rows.filter((e) => !relevant.includes(e) && (e.title + " " + (e.organizer || "")).toLocaleLowerCase("sv-SE").includes(needle)).slice(0, 30);
  const owned = relevant.filter((e) => ownsEvent(e, account.organizer_name, ov)).length;
  const row = (e: Ev) => {
    const m = mode(e), a = auto(e);
    const status = m === "include" ? "Manuellt tilldelad" : m === "exclude" ? "Dold från arrangören" : a ? "Automatisk" : "";
    return (
      <li key={evRef(e)}>
        <div><b>{e.title}</b><span>{e.day} · {e.start} · {e.organizer}</span>{status && <span>{status}</span>}</div>
        <div className="admin-actions">
          {m && <button type="button" onClick={() => post({ action: "link", user_id: account.user_id, event_ref: evRef(e), mode: "reset" })}>Återställ</button>}
          {!m && !a && <button type="button" onClick={() => post({ action: "link", user_id: account.user_id, event_ref: evRef(e), mode: "include" })}>Tilldela arrangören</button>}
          {!m && a && <button type="button" onClick={() => post({ action: "link", user_id: account.user_id, event_ref: evRef(e), mode: "exclude" })}>Dölj från arrangören</button>}
        </div>
      </li>
    );
  };
  return (
    <div className="admin-events">
      <form onSubmit={(e) => { e.preventDefault(); post({ action: "aliases", user_id: account.user_id, aliases: aliases.split(",") }); }}>
        <label>Andra namn i programmet (kommaseparerade)<input value={aliases} placeholder="t.ex. Skogsindustrierna Syd" onChange={(e) => setAliases(e.target.value)} /></label>
        <button className="auth-primary">Spara namn</button>
      </form>
      <label>År<select value={year} onChange={(e) => setYear(e.target.value)}>{Object.keys(years).sort().reverse().map((y) => <option key={y}>{y}</option>)}</select></label>
      <h3>Arrangörens programpunkter {year} ({owned})</h3>
      {relevant.length ? <ul className="admin-list">{relevant.map(row)}</ul> : <p>Inga programpunkter hittades för året.</p>}
      <label>Sök fler programpunkter att tilldela<input value={q} placeholder="Titel eller arrangör, minst 3 tecken" onChange={(e) => setQ(e.target.value)} /></label>
      {hits.length > 0 && <ul className="admin-list">{hits.map(row)}</ul>}
    </div>
  );
}
