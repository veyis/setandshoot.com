import { test, expect } from "@playwright/test";

const PAGES = [
  "/about",
  "/services",
  "/contact",
  "/highlights",
  "/athletes",
  "/journal",
  "/stories",
];

test.describe("SEO surface", () => {
  for (const path of PAGES) {
    test(`${path} has title, description, og:image, canonical`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(/.{10,}/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{20,}/);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    });
  }

  test("contact exposes JSON-LD", async ({ page }) => {
    await page.goto("/contact");
    const count = await page.locator('script[type="application/ld+json"]').count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
