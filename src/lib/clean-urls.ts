export const STATIC_PAGES = [
  "index",
  "program",
  "schema",
  "talare",
  "arrangor",
  "arrangor-login",
  "arrangorsverktyg",
  "annonsera",
  "kontakt",
  "gdpr",
  "mobil",
] as const;

export function cleanUrlTarget(pathname: string): string | null {
  const name = pathname.replace(/^\/+|\/+$/g, "");
  if (name === "signin-with-chatgpt") return "/signin";
  return (STATIC_PAGES as readonly string[]).includes(name) ? `/${name}.html` : null;
}
