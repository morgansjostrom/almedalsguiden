import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

export const Route = createFileRoute("/arrangor-nytt-losenord")({
  head: () => ({
    meta: [
      { title: "Välj nytt lösenord – Almedalskompassen" },
      { name: "description", content: "Byt det tillfälliga lösenordet till ett eget för ert arrangörskonto." },
      { property: "og:title", content: "Välj nytt lösenord – Almedalskompassen" },
      { property: "og:description", content: "Byt det tillfälliga lösenordet till ett eget för ert arrangörskonto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: "/auth.css" }],
  }),
  component: NewPassword,
});

function NewPassword() {
  const [email, setEmail] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/organizer-status", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (!d.user) window.location.replace("/signin?return_to=%2Farrangor-start.html");
      else setEmail(d.user.email || "");
    }).catch(() => setMsg("Det gick inte att kontrollera din inloggning."));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 10) return setMsg("Lösenordet behöver vara minst 10 tecken.");
    if (pw !== pw2) return setMsg("Lösenorden är inte lika.");
    setBusy(true); setMsg("");
    const r = await fetch("/api/organizer-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) window.location.replace("/arrangor-login.html");
    else setMsg(d.error === "same" ? "Välj ett annat lösenord än det tillfälliga." : "Det gick inte att spara lösenordet. Försök igen.");
  }

  return (
    <main className="auth-wrap">
      <a className="auth-brand" href="/index.html"><img src="/compass.svg" alt="" width={34} height={34} /> Almedalskompassen</a>
      <section className="auth-card">
        <h1>Välj ett eget lösenord</h1>
        <p>{email ? `Du är inloggad som ${email}. ` : ""}Byt det tillfälliga lösenordet från fakturan innan ni går vidare.</p>
        <form onSubmit={submit}>
          <label>Nytt lösenord<input type="password" required minLength={10} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <label>Upprepa lösenordet<input type="password" required minLength={10} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
          <button className="auth-primary" disabled={busy || email === null}>Spara och fortsätt</button>
        </form>
        {msg && <p className="auth-msg" role="status">{msg}</p>}
      </section>
    </main>
  );
}
