import { test, expect } from "@playwright/test";

test("German home renders the German tagline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "belin akguel" })).toBeVisible();
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();
});

test("English home renders the English tagline at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("Volleyball photography. Bremen.")).toBeVisible();
});

test("Landing page renders hero overlay + all sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /belin akguel/i, level: 1 })).toBeVisible();
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();

  const firstImg = page.locator("img").first();
  await expect(firstImg).toBeVisible();

  await expect(page.getByRole("heading", { name: "Highlights", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Stories$/, level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Über mich/i, level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Halle gebucht/i, level: 2 })).toBeVisible();

  await expect(page.getByRole("link", { name: "Anfrage stellen" }).first()).toBeVisible();
});

test("Landing hero rotator renders dot indicators", async ({ page }) => {
  await page.goto("/");
  const firstDot = page.getByRole("button", { name: "Show photo 1", exact: true });
  await expect(firstDot).toBeVisible();
});
