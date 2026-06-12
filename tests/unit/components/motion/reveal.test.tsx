import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Reveal } from "@/components/motion/reveal";

let observers: { callback: IntersectionObserverCallback; el: Element }[] = [];

beforeEach(() => {
  observers = [];
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;

  class MockIO implements IntersectionObserver {
    root = null;
    rootMargin = "";
    thresholds: ReadonlyArray<number> = [];
    constructor(callback: IntersectionObserverCallback) {
      this._cb = callback;
    }
    private _cb: IntersectionObserverCallback;
    observe(el: Element) {
      observers.push({ callback: this._cb, el });
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  window.IntersectionObserver = MockIO as unknown as typeof IntersectionObserver;
});

describe("Reveal", () => {
  it("renders children with data-revealed='false' before intersection", () => {
    render(
      <Reveal>
        <p>hello</p>
      </Reveal>,
    );
    const wrapper = screen.getByText("hello").parentElement!;
    expect(wrapper.getAttribute("data-revealed")).toBe("false");
  });

  it("flips data-revealed to 'true' once the element intersects", () => {
    render(
      <Reveal>
        <p>hello</p>
      </Reveal>,
    );
    const wrapper = screen.getByText("hello").parentElement!;
    const o = observers[0]!;
    act(() => {
      o.callback(
        [
          {
            isIntersecting: true,
            target: o.el,
            intersectionRatio: 1,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0,
          },
        ],
        {} as IntersectionObserver,
      );
    });
    expect(wrapper.getAttribute("data-revealed")).toBe("true");
  });
});
