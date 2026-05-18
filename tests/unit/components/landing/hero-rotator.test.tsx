import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { HeroRotator } from "@/components/landing/hero-rotator";

const photos = [
  { id: 1, alt: "Photo 1", src: "/media/1.jpg" },
  { id: 2, alt: "Photo 2", src: "/media/2.jpg" },
  { id: 3, alt: "Photo 3", src: "/media/3.jpg" },
];

const matchMediaMock = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  matchMediaMock.mockClear();
  matchMediaMock.mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HeroRotator", () => {
  it("renders the first photo as active on mount", () => {
    render(<HeroRotator photos={photos} overlay={<div>OVERLAY</div>} />);
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("0");
    expect(screen.getByText("OVERLAY")).toBeInTheDocument();
  });

  it("advances to the next photo every 6 seconds", () => {
    render(<HeroRotator photos={photos} overlay={null} />);
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("0");
    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("1");
    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("2");
  });

  it("does not advance when prefers-reduced-motion is set", () => {
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
    render(<HeroRotator photos={photos} overlay={null} />);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("0");
  });

  it("jumps to a specific index when its dot is clicked", () => {
    render(<HeroRotator photos={photos} overlay={null} />);
    fireEvent.click(screen.getByLabelText("Show photo 3"));
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("2");
  });

  it("renders only the overlay when photos array is empty", () => {
    render(<HeroRotator photos={[]} overlay={<div>OVERLAY</div>} />);
    expect(screen.getByText("OVERLAY")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
