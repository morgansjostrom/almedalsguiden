import { describe, expect, it } from "vitest";
import { eventBelongs, ownsEvent, packageQuota, parseSpokespeople, slugify, validSlug } from "./organizer-packages";

describe("organizer packages", () => {
  it("Grundpaket allows one article and one featured event", () => {
    expect(packageQuota("grund")).toEqual({ articles: 1, featured: 1, spokespeople: 2 });
  });
  it("Utökat paket allows up to five articles and five featured events", () => {
    expect(packageQuota("utokat")).toEqual({ articles: 5, featured: 5, spokespeople: 10 });
  });
  it("organizers may only pick events they (co-)organize", () => {
    expect(eventBelongs("Bliwa, PwC Sverige", "PwC Sverige AB")).toBe(true);
    expect(eventBelongs("Bliwa", "PwC Sverige")).toBe(false);
  });
  it("admin can assign an unmatched event, hide a matched one and add aliases", () => {
    const a = { id: 1, day: "2026-06-22", start: "10:00", organizer: "Skogsindustrierna Syd" };
    const b = { id: 2, day: "2026-06-22", start: "11:00", organizer: "Skogsindustrierna" };
    expect(ownsEvent(a, "Skogsindustrierna")).toBe(false);
    expect(ownsEvent(a, "Skogsindustrierna", { include: ["1|2026-06-22|10:00"] })).toBe(true);
    expect(ownsEvent(a, "Skogsindustrierna", { aliases: ["Skogsindustrierna Syd"] })).toBe(true);
    expect(ownsEvent(b, "Skogsindustrierna", { exclude: ["2|2026-06-22|11:00"] })).toBe(false);
  });
  it("landing page address follows the company name", () => {
    expect(slugify("Region Jönköpings län")).toBe("region-jonkopings-lan");
    expect(validSlug("program")).toBe(false);
  });
  it("rejects more spokespeople than the package allows", () => {
    expect(parseSpokespeople([{ name: "A" }, { name: "B" }, { name: "C" }], 2)).toEqual({ error: "Ert paket rymmer högst 2 talespersoner." });
  });
  it("program participation is hidden unless explicitly chosen", () => {
    const r = parseSpokespeople([{ name: "Anna", linkedin: "https://www.linkedin.com/in/anna" }], 2);
    expect("list" in r && r.list[0]?.showProgram).toBe(false);
  });
  it("rejects non-LinkedIn profile links", () => {
    expect("error" in parseSpokespeople([{ name: "A", linkedin: "https://example.com/in/a" }], 2)).toBe(true);
  });
});
