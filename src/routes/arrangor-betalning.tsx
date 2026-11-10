import { createFileRoute, redirect } from "@tanstack/react-router";

// Card payment removed: organizers are invoiced. Old links go to the organizer landing page.
export const Route = createFileRoute("/arrangor-betalning")({
  beforeLoad: () => {
    throw redirect({ href: "/arrangor-start.html" });
  },
});
