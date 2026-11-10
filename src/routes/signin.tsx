import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { SITE_LANGUAGE_KEY, signInLanguage, signInCopy } from "@/lib/sign-in-language";
import { handoff, rememberReturn, safeReturn } from "@/lib/auth-handoff";

// Identity is verified Cloud auth; the language matches the static site.
export const Route = createFileRoute("/signin")({
  validateSearch: (s: Record<string, unknown>) => ({ return_to: safeReturn(s["return_to"]) }),
  head: () => ({
    meta: [
      { title: "Logga in – Almedalskompassen" },
      { name: "description", content: "Logga in på Almedalskompassen för att spara din Almedalsvecka." },
      { property: "og:title", content: "Logga in – Almedalskompassen" },
      { property: "og:description", content: "Logga in på Almedalskompassen för att spara din Almedalsvecka." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: "/auth.css" }],
  }),
  component: SignIn,
});

function SignIn() {
  const { return_to } = Route.useSearch();
  const organizer = return_to.startsWith("/arrangor");
  const [language, setLanguage] = useState<"sv" | "en">("sv");
  const copy = signInCopy[language];
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(SITE_LANGUAGE_KEY); } catch {}
    const selected = signInLanguage(stored, navigator.languages?.length ? navigator.languages : [navigator.language]);
    setLanguage(selected);
    document.documentElement.lang = selected;
  }, []);

  useEffect(() => {
    // After the Google round-trip the URL has no return_to; keep the remembered one.
    if (new URLSearchParams(window.location.search).has("return_to")) rememberReturn(return_to);
    handoff(return_to);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") handoff(return_to);
    });
    return () => data.subscription.unsubscribe();
  }, [return_to]);

  async function google() {
    setMsg("");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/signin" });
    if (r.error) setMsg(copy.googleError);
    else if (!r.redirected) await handoff(return_to);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        setMsg(error ? copy.linkError : copy.linkSent);
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/signin?return_to=" + encodeURIComponent(return_to) },
        });
        if (error) setMsg(copy.signupError);
        else if (!data.session) setMsg(copy.confirm);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMsg(copy.credentials);
      }
    } catch {
      setMsg(copy.requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap" lang={language}>
      <a className="auth-brand" href="/index.html"><img src="/compass.svg" alt="" width={34} height={34} /> Almedalskompassen</a>
      <section className="auth-card">
        <h1>{organizer ? copy.organizer : copy[mode]}</h1>
        <p>{organizer ? copy.organizerIntro : copy.intro}</p>
        {mode !== "forgot" && !organizer && (
          <>
            <Button variant="ghost" type="button" className="auth-google" onClick={google}>{copy.google}</Button>
            <div className="auth-or"><span>{copy.or}</span></div>
          </>
        )}
        <form onSubmit={submit}>
          <label>{copy.email}<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {mode !== "forgot" && (
            <label>{copy.password}<input type="password" required minLength={8} autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          )}
          <Button variant="ghost" className="auth-primary" disabled={busy}>{mode === "forgot" ? copy.send : copy[mode]}</Button>
        </form>
        {msg && <p className="auth-msg" role="status">{msg}</p>}
        <p className="auth-links">
          {mode !== "in" && <Button variant="ghost" type="button" onClick={() => setMode("in")}>{copy.account}</Button>}
          {mode !== "up" && !organizer && <Button variant="ghost" type="button" onClick={() => setMode("up")}>{copy.up}</Button>}
          {mode !== "forgot" && <Button variant="ghost" type="button" onClick={() => setMode("forgot")}>{copy.forgotten}</Button>}
        </p>
        <p className="auth-links"><a href={return_to}>{copy.back}</a></p>
      </section>
    </main>
  );
}
