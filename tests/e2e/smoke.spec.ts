import { test, expect } from "@playwright/test";

test("German home renders the German hero masthead", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("belin akguel · sportfotografie")).toBeVisible();
});

test("English home renders the English hero masthead at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("belin akguel · sports photography")).toBeVisible();
});

test("Landing renders all five elevation scenes (DE)", async ({ page }) => {
  await page.goto("/");

  // Hero h1
  await expect(page.getByRole("heading", { name: /belin akguel/i, level: 1 })).toBeVisible();

  // Featured story "read" CTA (stable i18n copy, not the seeded story title)
  await expect(page.getByText("Story lesen").first()).toBeVisible();

  // Work Mosaic eyebrow contains WORK (use .first() in case "WORK" appears in nav too)
  await expect(page.getByText(/^WORK$/).first()).toBeVisible();

  // About eyebrow
  await expect(page.getByText("ÜBER MICH").first()).toBeVisible();

  // Booking CTA primary link
  // Booking CTA primary link — scoped to the booking-cta section to avoid colliding
  // with the hero sticky-CTA which uses a near-identical label ("Anfrage stellen").
  // The arrow is aria-hidden, so accessible name is just the text.
  await expect(
    page.locator(".booking-cta").getByRole("link", { name: "ANFRAGE STELLEN" }),
  ).toBeVisible();
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
  await expect(page.getByText("Story lesen").first()).toBeVisible();
  await expect(page.getByText("ÜBER MICH").first()).toBeVisible();
  // Booking CTA primary link — scoped to the booking-cta section to avoid colliding
  // with the hero sticky-CTA which uses a near-identical label ("Anfrage stellen").
  // The arrow is aria-hidden, so accessible name is just the text.
  await expect(
    page.locator(".booking-cta").getByRole("link", { name: "ANFRAGE STELLEN" }),
  ).toBeVisible();
});
