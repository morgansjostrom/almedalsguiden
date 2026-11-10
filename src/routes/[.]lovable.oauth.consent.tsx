import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Details = { client?: { name?: string; client_name?: string; redirect_uri?: string } | null; redirect_uri?: string; scope?: string; redirect_url?: string; redirect_to?: string };
type OAuthApi = {
  getAuthorizationDetails(id: string): Promise<{ data: Details | null; error: { message: string } | null }>;
  approveAuthorization(id: string): Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization(id: string): Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Koppla app – Almedalskompassen" },
      { name: "description", content: "Godkänn att en extern app får använda Almedalskompassen som du." },
      { property: "og:title", content: "Koppla app – Almedalskompassen" },
      { property: "og:description", content: "Godkänn att en extern app får använda Almedalskompassen som du." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: "/auth.css" }],
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Länken saknar auktoriserings-id.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ href: "/signin?return_to=" + encodeURIComponent(next) });
    }
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    const { data: u } = await supabase.auth.getUser();
    return { details: data, email: u.user?.email ?? "" };
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="auth-page"><div className="auth-card"><h1>Kopplingen kunde inte laddas</h1><p>{error instanceof Error ? error.message : String(error)}</p><p className="auth-links"><a href="/schema.html">Till programmet</a></p></div></main>
  ),
});

function Consent() {
  const { details, email } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = details?.client?.name ?? details?.client?.client_name ?? "En app";
  const redirectUri = details?.client?.redirect_uri ?? details?.redirect_uri;

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
    const target = data?.redirect_url ?? data?.redirect_to;
    if (error || !target) {
      setBusy(false);
      setError(error?.message ?? "Inget svar från inloggningstjänsten.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Koppla {client} till Almedalskompassen</h1>
        <p>Inloggad som <strong>{email}</strong>.</p>
        <p>{client} kommer att kunna läsa och ändra dina sparade programpunkter i Min Almedalsvecka.</p>
        {redirectUri && <p>Skickas tillbaka till: {redirectUri}</p>}
        <p>Delar din grundprofil och e-postadress. Sajtens behörigheter gäller fortfarande.</p>
        {error && <p role="alert">{error}</p>}
        <button className="auth-primary" disabled={busy} onClick={() => decide(true)}>Godkänn</button>
        <button disabled={busy} onClick={() => decide(false)}>Avbryt koppling</button>
      </div>
    </main>
  );
}
