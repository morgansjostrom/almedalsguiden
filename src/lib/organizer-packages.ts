// Pure rules for organizer packages (no I/O, unit tested).
export type PackageTier = "grund" | "utokat";

export const PACKAGE_LABEL: Record<PackageTier, string> = { grund: "Grundpaket", utokat: "Utökat paket" };

/** Grundpaket: 1 article + 1 featured event + 2 spokespeople. Utökat: 5 + 5 + 10. */
export function packageQuota(tier: PackageTier | string | null | undefined) {
  const big = tier === "utokat";
  const n = big ? 5 : 1;
  return { articles: n, featured: n, spokespeople: big ? 10 : 2 };
}

export type Spokesperson = { name: string; title: string; expertise: string; email: string; linkedin: string; showProgram: boolean };
const LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+\/?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cut = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** Validates bookable spokespeople against the package quota; returns list or a Swedish error. */
export function parseSpokespeople(input: unknown, max: number): { list: Spokesperson[] } | { error: string } {
  if (!Array.isArray(input)) return { error: "Ogiltiga uppgifter." };
  if (input.length > max) return { error: `Ert paket rymmer högst ${max} talespersoner.` };
  const list: Spokesperson[] = [];
  for (const raw of input as Record<string, unknown>[]) {
    const p = { name: cut(raw?.["name"], 100), title: cut(raw?.["title"], 150), expertise: cut(raw?.["expertise"], 600), email: cut(raw?.["email"], 200), linkedin: cut(raw?.["linkedin"], 200), showProgram: raw?.["showProgram"] === true };
    if (!p.name) return { error: "Varje talesperson behöver ett namn." };
    if (p.email && !EMAIL.test(p.email)) return { error: `Kontrollera e-postadressen för ${p.name}.` };
    if (p.linkedin && !LINKEDIN.test(p.linkedin)) return { error: `LinkedIn-länken för ${p.name} ska börja med https://www.linkedin.com/in/` };
    list.push(p);
  }
  return { list };
}

export const normalizeOrganizer = (s: unknown) =>
  String(s || "").normalize("NFKC").trim().replace(/\s+/g, " ").replace(/ AB$/i, "").toLocaleLowerCase("sv-SE");

/** An event belongs to the organizer when its (co-)organizer list contains the name. */
export function eventBelongs(organizerField: unknown, organizerName: string) {
  const want = normalizeOrganizer(organizerName);
  return !!want && String(organizerField || "").split(/[,;]/).some((n) => normalizeOrganizer(n) === want);
}

export type EventLinks = { aliases?: string[]; include?: string[]; exclude?: string[] };

/** Admin overrides win: a manually included event always belongs, an excluded one never;
 *  otherwise the organizer field must contain the name or one of its aliases. */
export function ownsEvent(e: { id: string | number; day: string; start: string; organizer?: unknown }, name: string, links: EventLinks = {}) {
  const ref = [e.id, e.day, e.start].join("|");
  if (links.include?.includes(ref)) return true;
  if (links.exclude?.includes(ref)) return false;
  return [name, ...(links.aliases || [])].some((n) => eventBelongs(e.organizer, n));
}

/** URL slug, e.g. "Region Jönköpings län" -> "region-jonkopings-lan". */
export function slugify(name: string) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export const RESERVED_SLUGS = new Set(["api", "admin", "assets", "program", "schema", "talare", "kontakt", "gdpr", "annonsera", "arrangor", "arrangorsverktyg", "mobil", "index", "reset-password", "signin", "signin-with-chatgpt", "signout-with-chatgpt", "arrangor-nytt-losenord", "arrangor-betalning", "arrangor-start", "arrangor-login"]);
export const validSlug = (s: unknown): s is string =>
  typeof s === "string" && /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(s) && !RESERVED_SLUGS.has(s);

export const EVENT_REF = /^[^|]{1,40}\|\d{4}-\d{2}-\d{2}\|\d{2}:\d{2}$/;
