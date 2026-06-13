import { describe, expect, it } from "vitest";
import { resolveSeo } from "@/lib/seo/copy";

describe("resolveSeo", () => {
  const base = { title: "Base T", description: "Base D" };
  it("uses base when no override", () => {
    expect(resolveSeo(base)).toEqual(base);
  });
  it("override wins when non-empty", () => {
    expect(resolveSeo(base, { title: "Over", description: "OverD" })).toEqual({
      title: "Over",
      description: "OverD",
    });
  });
  it("empty/whitespace/null override falls back to base", () => {
    expect(resolveSeo(base, { title: "  ", description: null })).toEqual(base);
  });
});
