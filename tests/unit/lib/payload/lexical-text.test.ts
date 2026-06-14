import { describe, expect, it } from "vitest";
import { lexicalToPlainText } from "@/lib/payload/lexical-text";

describe("lexicalToPlainText", () => {
  it("returns '' for null/undefined/empty", () => {
    expect(lexicalToPlainText(null)).toBe("");
    expect(lexicalToPlainText(undefined)).toBe("");
    expect(lexicalToPlainText({})).toBe("");
  });
  it("concatenates nested text nodes", () => {
    const state = {
      root: {
        children: [
          { children: [{ text: "Hallo" }, { text: "Welt" }] },
          { children: [{ text: "zweiter Absatz" }] },
        ],
      },
    };
    expect(lexicalToPlainText(state)).toBe("Hallo Welt zweiter Absatz");
  });
  it("collapses whitespace", () => {
    const state = { root: { children: [{ children: [{ text: "a\n\n  b" }] }] } };
    expect(lexicalToPlainText(state)).toBe("a b");
  });
});
