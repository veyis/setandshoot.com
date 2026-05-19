import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";

const matchMediaMock = vi.fn();

beforeEach(() => {
  matchMediaMock.mockReset();
  window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
});

describe("useReducedMotion", () => {
  it("returns false when prefers-reduced-motion is not set", () => {
    matchMediaMock.mockImplementation((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when prefers-reduced-motion: reduce is set", () => {
    matchMediaMock.mockImplementation((q: string) => ({
      matches: q.includes("reduced-motion"),
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
