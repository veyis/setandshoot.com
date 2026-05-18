import { describe, it, expect } from "vitest";
import { tokens } from "@/lib/design/tokens";

describe("design tokens", () => {
  it("exposes the cinematic canvas color", () => {
    expect(tokens.color.canvas).toBe("var(--bg-canvas)");
  });

  it("exposes the editorial display font binding", () => {
    expect(tokens.font.display).toBe("var(--font-display)");
  });
});
