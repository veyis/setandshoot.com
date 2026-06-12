import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

describe("safeRedirectPath", () => {
  it("allows same-origin paths", () => {
    expect(safeRedirectPath("/account/bookings")).toBe("/account/bookings");
    expect(safeRedirectPath("/admin")).toBe("/admin");
  });

  it("rejects absolute URLs (open redirect)", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/account");
    expect(safeRedirectPath("http://evil.com")).toBe("/account");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/account");
  });

  it("falls back for undefined or non-path values", () => {
    expect(safeRedirectPath(undefined)).toBe("/account");
    expect(safeRedirectPath("account")).toBe("/account");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/account");
  });

  it("honors a custom fallback", () => {
    expect(safeRedirectPath(undefined, "/")).toBe("/");
  });
});
