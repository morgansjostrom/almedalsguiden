import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { cleanUrlTarget } from "@/lib/clean-urls";
import { validSlug } from "@/lib/organizer-packages";

// Public read of organizer profiles (public SELECT policy) to resolve /foretagsnamn.
const organizerExists = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    if (!validSlug(slug)) return false;
    if (slug === "almedalskompassen") return true;
    const { anonClient } = await import("@/lib/api-session");
    const { data } = await anonClient().from("organizer_profiles").select("slug").eq("slug", slug).maybeSingle();
    return !!data;
  });

// Clean URLs (/schema, /program, ...) redirect to the original static .html pages,
// keeping query string and hash so deep links like ?event=id|day|start survive.
// Organizer landing pages live at /foretagsnamn.
export const Route = createFileRoute("/$")({
  beforeLoad: async ({ location }) => {
    const target = cleanUrlTarget(location.pathname);
    if (target) throw redirect({ href: target + (location.searchStr || "") + (location.hash ? "#" + location.hash : ""), statusCode: 308 });
    const slug = location.pathname.replace(/^\/+|\/+$/g, "");
    if (validSlug(slug) && (await organizerExists({ data: slug }))) throw redirect({ href: "/arrangor.html?slug=" + encodeURIComponent(slug), statusCode: 302 });
    throw notFound();
  },
});
