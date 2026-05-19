import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroScene } from "@/components/landing/hero";
import { getHeroPhotos } from "@/lib/landing/photos";

/** Real landing config — all 8 generated hero frames. */
const photos = getHeroPhotos("en");

// Reduce-motion → true so usePinnedScene (GSAP ScrollTrigger) no-ops in jsdom.
// ScrollTrigger's pin mutates the DOM (wraps in pin-spacer), which breaks
// React Testing Library cleanup. The render-output assertions below are
// independent of motion state.
const matchMediaMock = vi.fn((q: string) => ({
  matches: q === "(prefers-reduced-motion: reduce)",
  media: q,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

beforeEach(() => {
  matchMediaMock.mockClear();
  window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

const baseProps = {
  name: "belin akguel",
  tagline: "Volleyball-Fotografie. Bremen.",
  cameraSpec: "f/2.8 · 1/2000s · ISO 6400",
  ctaPrimaryLabel: "Stories entdecken",
  ctaPrimaryHref: "/stories",
  ctaSecondaryLabel: "Anfrage stellen",
  ctaSecondaryHref: "/contact",
  scrollCueLabel: "scroll",
  mastheadLeft: "belin akguel · sports photography",
  mastheadCounter: "Reel · {current} ⁄ {total}",
};

describe("HeroScene", () => {
  it("renders all 8 generated hero photos in the stack", () => {
    expect(photos).toHaveLength(8);
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const slides = container.querySelectorAll(".hero-photo[data-photo-id]");
    expect(slides).toHaveLength(8);
    for (const photo of photos) {
      expect(container.querySelector(`[data-photo-id="${photo.id}"]`)).not.toBeNull();
      expect(screen.getByAltText(photo.alt)).toBeInTheDocument();
    }
  });

  it("renders every photo (all stacked, only one visually active at a time)", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    expect(screen.getByAltText(photos[0]!.alt)).toBeInTheDocument();
    expect(screen.getByAltText(photos[7]!.alt)).toBeInTheDocument();
  });

  it("marks the first photo as active on mount", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const section = container.querySelector(".hero-scene");
    expect(section?.getAttribute("data-active-index")).toBe("0");
  });

  it("renders the name as an h1", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/belin/);
    expect(h1.textContent).toMatch(/akguel/);
  });

  it("renders both CTAs with correct href", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    expect(screen.getByRole("link", { name: "Stories entdecken" })).toHaveAttribute(
      "href",
      "/stories",
    );
    expect(screen.getByRole("link", { name: "Anfrage stellen" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("renders the scroll cue label", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    expect(screen.getByText("scroll")).toBeInTheDocument();
  });

  it("renders only the overlay when photos is empty", () => {
    render(<HeroScene {...baseProps} photos={[]} />);
    expect(screen.queryAllByRole("img").length).toBe(0);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/belin/);
    expect(h1.textContent).toMatch(/akguel/);
  });

  it("marks the active photo via data-active='true' and others 'false'", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const stack = container.querySelectorAll(".hero-photo");
    expect(stack.length).toBe(photos.length);
    expect(stack[0]!.getAttribute("data-active")).toBe("true");
    for (let i = 1; i < stack.length; i++) {
      expect(stack[i]!.getAttribute("data-active")).toBe("false");
    }
  });

  it("emits a data-variant in 1..4 cycling across photos for Ken Burns trajectory", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const stack = container.querySelectorAll(".hero-photo");
    for (let i = 0; i < stack.length; i++) {
      expect(stack[i]!.getAttribute("data-variant")).toBe(String((i % 4) + 1));
    }
  });

  it("renders the masthead left wordmark and right counter", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    expect(container.querySelector('[data-test="hero-masthead-left"]')?.textContent).toBe(
      baseProps.mastheadLeft,
    );
    expect(container.querySelector('[data-test="hero-masthead-counter"]')?.textContent).toBe(
      "Reel · 01 ⁄ 08",
    );
  });

  it("renders the progress strip when there are 2+ photos", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    expect(container.querySelector(".hero-progress-fill")).toBeInTheDocument();
  });

  it("does not render the progress strip with a single photo", () => {
    const { container } = render(<HeroScene {...baseProps} photos={[photos[0]!]} />);
    expect(container.querySelector(".hero-progress-fill")).toBeNull();
  });

  it("renders the active photo's kicker in the cover title block", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const kicker = container.querySelector('[data-test="hero-kicker"]')?.textContent ?? "";
    expect(kicker.length).toBeGreaterThan(0);
    expect(kicker).toContain(photos[0]!.kicker);
  });

  it("renders the active photo's camera spec, not the static i18n prop", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const spec = container.querySelector('[data-test="hero-camera"]')?.textContent ?? "";
    expect(spec).toBe(photos[0]!.cameraSpec);
  });

  it("renders the cover title with two lines (belin / akguel.)", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/belin/);
    expect(h1.textContent).toMatch(/akguel\./);
  });

  it("renders both CTAs once with correct hrefs (sticky bar carries them)", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    const stories = screen.getAllByRole("link", { name: baseProps.ctaPrimaryLabel });
    const book = screen.getAllByRole("link", { name: baseProps.ctaSecondaryLabel });
    expect(stories.length).toBe(1);
    expect(book.length).toBe(1);
    expect(stories[0]).toHaveAttribute("href", baseProps.ctaPrimaryHref);
    expect(book[0]).toHaveAttribute("href", baseProps.ctaSecondaryHref);
  });

  it("renders the CTA bar element (visibility is CSS-driven by breakpoint)", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    expect(container.querySelector('[data-test="hero-cta-bar"]')).toBeInTheDocument();
  });
});
