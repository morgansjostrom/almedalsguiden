import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handoff } from "@/lib/auth-handoff";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nytt lösenord – Almedalskompassen" },
      { name: "description", content: "Välj ett nytt lösenord för ditt konto på Almedalskompassen." },
      { property: "og:title", content: "Nytt lösenord – Almedalskompassen" },
      { property: "og:description", content: "Välj ett nytt lösenord för ditt konto på Almedalskompassen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: "/auth.css" }],
  }),
  component: Reset,
});

function Reset() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setMsg("Länken har gått ut eller är ogiltig. Begär en ny.");
    setMsg("Lösenordet är bytt.");
    await handoff("/schema.html");
  }
  return (
    <main className="auth-wrap">
      <a className="auth-brand" href="/index.html"><img src="/compass.svg" alt="" width={34} height={34} /> Almedalskompassen</a>
      <section className="auth-card">
        <h1>Välj nytt lösenord</h1>
        <form onSubmit={submit}>
          <label>Nytt lösenord<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="auth-primary">Spara lösenord</button>
        </form>
        {msg && <p className="auth-msg" role="status">{msg}</p>}
      </section>
    </main>
  );
}
