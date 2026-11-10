import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeReturn } from "@/lib/auth-handoff";

export const Route = createFileRoute("/signout-with-chatgpt")({
  validateSearch: (s: Record<string, unknown>) => ({ return_to: safeReturn(s["return_to"]) }),
  head: () => ({
    meta: [
      { title: "Loggar ut – Almedalskompassen" },
      { name: "description", content: "Du loggas ut från Almedalskompassen." },
      { property: "og:title", content: "Loggar ut – Almedalskompassen" },
      { property: "og:description", content: "Du loggas ut från Almedalskompassen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: "/auth.css" }],
  }),
  component: SignOut,
});

function SignOut() {
  const { return_to } = Route.useSearch();
  useEffect(() => {
    (async () => {
      await fetch("/api/session", { method: "DELETE" }).catch(() => {});
      await supabase.auth.signOut().catch(() => {});
      window.location.replace(return_to);
    })();
  }, [return_to]);
  return <main className="auth-wrap"><p>Loggar ut…</p></main>;
}
