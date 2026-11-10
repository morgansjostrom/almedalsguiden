import { describe, expect, it } from "vitest";
import { accessPeriod, isAccessActive, tempPassword, validNewPassword } from "./organizer-accounts";

describe("organizer accounts", () => {
  it("access lasts exactly one year from start", () => {
    expect(accessPeriod(new Date("2027-01-15T00:00:00Z"))).toEqual({ starts_at: "2027-01-15T00:00:00.000Z", expires_at: "2028-01-15T00:00:00.000Z" });
  });
  it("access ends after one year", () => {
    const a = { active: true, ...accessPeriod(new Date("2026-01-01T00:00:00Z")) };
    expect(isAccessActive(a, new Date("2026-12-31T00:00:00Z"))).toBe(true);
    expect(isAccessActive(a, new Date("2027-01-02T00:00:00Z"))).toBe(false);
  });
  it("switched-off account has no access", () => {
    expect(isAccessActive({ active: false, ...accessPeriod(new Date("2026-01-01T00:00:00Z")) }, new Date("2026-06-01T00:00:00Z"))).toBe(false);
  });
  it("temporary passwords are 14 characters and differ", () => {
    expect(tempPassword()).toHaveLength(14);
    expect(tempPassword()).not.toBe(tempPassword());
  });
  it("new password needs at least 10 characters", () => {
    expect(validNewPassword("short")).toBe(false);
    expect(validNewPassword("longenough1")).toBe(true);
  });
});
