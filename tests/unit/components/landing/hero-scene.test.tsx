import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroScene } from "@/components/landing/hero-scene";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

const heroPhoto: ResolvedLandingPhoto = {
  id: "spike",
  src: "/images/landing/hero-spike.jpg",
  width: 2752,
  height: 1536,
  objectPosition: "50% 50%",
  alt: "Test hero photo",
  isHighlight: true,
};

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
});

describe("HeroScene", () => {
  it("renders the hero photo with the right alt", () => {
    render(
      <HeroScene
        photo={heroPhoto}
        name="belin akguel"
        tagline="Volleyball-Fotografie. Bremen."
        cameraSpec="f/2.8 · 1/2000s · ISO 6400"
        ctaPrimaryLabel="Stories entdecken"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="Anfrage stellen"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    expect(screen.getByAltText("Test hero photo")).toBeInTheDocument();
  });

  it("renders the name as an h1", () => {
    render(
      <HeroScene
        photo={heroPhoto}
        name="belin akguel"
        tagline="x"
        cameraSpec="x"
        ctaPrimaryLabel="x"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="x"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("belin akguel");
  });

  it("renders both CTAs with correct href", () => {
    render(
      <HeroScene
        photo={heroPhoto}
        name="belin akguel"
        tagline="x"
        cameraSpec="x"
        ctaPrimaryLabel="Primary"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="Secondary"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    expect(screen.getByRole("link", { name: "Primary" })).toHaveAttribute("href", "/stories");
    expect(screen.getByRole("link", { name: "Secondary" })).toHaveAttribute("href", "/contact");
  });

  it("renders the scroll cue label", () => {
    render(
      <HeroScene
        photo={heroPhoto}
        name="belin akguel"
        tagline="x"
        cameraSpec="x"
        ctaPrimaryLabel="x"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="x"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    expect(screen.getByText("scroll")).toBeInTheDocument();
  });

  it("does not render a photo when `photo` is null", () => {
    render(
      <HeroScene
        photo={null}
        name="belin akguel"
        tagline="x"
        cameraSpec="x"
        ctaPrimaryLabel="x"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="x"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    expect(screen.queryAllByRole("img").length).toBe(0);
  });
});
