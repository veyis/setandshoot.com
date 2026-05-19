import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroScene } from "@/components/landing/hero-scene";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

function makePhoto(id: string, alt: string): ResolvedLandingPhoto {
  return {
    id: id as ResolvedLandingPhoto["id"],
    src: `/images/landing/${id}.jpg`,
    width: 1588,
    height: 1131,
    objectPosition: "50% 50%",
    alt,
    isHighlight: true,
  };
}

const photos: ResolvedLandingPhoto[] = [
  makePhoto("spike", "Photo 1"),
  makePhoto("block", "Photo 2"),
  makePhoto("serve", "Photo 3"),
  makePhoto("block-alt", "Photo 4"),
];

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

const baseProps = {
  name: "belin akguel",
  tagline: "Volleyball-Fotografie. Bremen.",
  cameraSpec: "f/2.8 · 1/2000s · ISO 6400",
  ctaPrimaryLabel: "Stories entdecken",
  ctaPrimaryHref: "/stories",
  ctaSecondaryLabel: "Anfrage stellen",
  ctaSecondaryHref: "/contact",
  scrollCueLabel: "scroll",
};

describe("HeroScene", () => {
  it("renders every photo (all stacked, only one visually active at a time)", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    expect(screen.getByAltText("Photo 1")).toBeInTheDocument();
    expect(screen.getByAltText("Photo 2")).toBeInTheDocument();
    expect(screen.getByAltText("Photo 3")).toBeInTheDocument();
    expect(screen.getByAltText("Photo 4")).toBeInTheDocument();
  });

  it("marks the first photo as active on mount", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const section = container.querySelector(".hero-scene");
    expect(section?.getAttribute("data-active-index")).toBe("0");
  });

  it("renders the name as an h1", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("belin akguel");
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

  it("renders one dot indicator per photo when there are 2+ photos", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    const dots = screen.getAllByRole("button", { name: /Show photo \d+ of 4/ });
    expect(dots.length).toBe(4);
  });

  it("does not render dot indicators with a single photo", () => {
    render(<HeroScene {...baseProps} photos={[photos[0]!]} />);
    const dots = screen.queryAllByRole("button", { name: /Show photo/ });
    expect(dots.length).toBe(0);
  });

  it("jumping to a dot updates the active index", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const thirdDot = screen.getByRole("button", { name: "Show photo 3 of 4" });
    fireEvent.click(thirdDot);
    const section = container.querySelector(".hero-scene");
    expect(section?.getAttribute("data-active-index")).toBe("2");
  });

  it("renders only the overlay when photos is empty", () => {
    render(<HeroScene {...baseProps} photos={[]} />);
    expect(screen.queryAllByRole("img").length).toBe(0);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("belin akguel");
  });
});
