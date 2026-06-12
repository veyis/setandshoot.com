import { describe, it, expect } from "vitest";
import { rateLimit, clientIp } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks within the window", () => {
    const key = `test-${Math.round(performance.now())}-${Math.floor(performance.timeOrigin)}`;
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(false);
  });

  it("tracks keys independently", () => {
    const a = `a-${performance.now()}`;
    const b = `b-${performance.now()}`;
    expect(rateLimit(a, 1, 60_000)).toBe(true);
    expect(rateLimit(a, 1, 60_000)).toBe(false);
    expect(rateLimit(b, 1, 60_000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip then 'unknown'", () => {
    expect(clientIp(new Request("https://x.test", { headers: { "x-real-ip": "9.9.9.9" } }))).toBe(
      "9.9.9.9",
    );
    expect(clientIp(new Request("https://x.test"))).toBe("unknown");
  });
});
