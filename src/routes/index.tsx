import { createFileRoute, redirect } from "@tanstack/react-router";

// Original site: "/" redirects to the static /index.html (see source app/page.tsx).
export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: "/index.html" + (location.searchStr || "") + (location.hash ? "#" + location.hash : ""), statusCode: 307 });
  },
  head: () => ({
    meta: [
      { title: "Almedalskompassen" },
      {
        name: "description",
        content:
          "Almedalskompassen hjälper dig att hitta samtalen som angår dig – och människorna du vill möta.",
      },
      { property: "og:title", content: "Almedalskompassen" },
      {
        property: "og:description",
        content:
          "Almedalskompassen hjälper dig att hitta samtalen som angår dig – och människorna du vill möta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
