import { test, expect } from "@playwright/test";

test("German home renders the German tagline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();
});

test("English home renders the English tagline at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("Volleyball photography. Bremen.")).toBeVisible();
});

test("Landing renders all five elevation scenes (DE)", async ({ page }) => {
  await page.goto("/");

  // Hero h1
  await expect(page.getByRole("heading", { name: /belin akguel/i, level: 1 })).toBeVisible();

  // Featured story title (depends on seeded story)
  await expect(page.getByText(/Pre-Saison/i).first()).toBeVisible();

  // Work Mosaic eyebrow contains WORK (use .first() in case "WORK" appears in nav too)
  await expect(page.getByText(/^WORK$/).first()).toBeVisible();

  // About eyebrow
  await expect(page.getByText("ÜBER MICH").first()).toBeVisible();

  // Booking CTA primary link
  await expect(page.getByRole("link", { name: "ANFRAGE STELLEN →" })).toBeVisible();
});

test("Landing scroll cue is present", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("scroll").first()).toBeVisible();
});

test("Landing renders under prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: /belin akguel/i, level: 1 })).toBeVisible();
  await expect(page.getByText(/Pre-Saison/i).first()).toBeVisible();
  await expect(page.getByText("ÜBER MICH").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "ANFRAGE STELLEN →" })).toBeVisible();
});
