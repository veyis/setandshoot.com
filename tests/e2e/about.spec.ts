import { expect, test } from "@playwright/test";

test("About (DE) renders heading, intro, portrait, and CTA", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: /Über mich/i })).toBeVisible();
  await expect(page.locator("figure img").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Anfrage stellen/i })).toBeVisible();
});

test("About (EN) renders the English heading", async ({ page }) => {
  await page.goto("/en/about");
  await expect(page.getByRole("heading", { level: 1, name: /^About$/i })).toBeVisible();
});
