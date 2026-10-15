import { test, expect } from "@playwright/test";

/**
 * Production smoke monitor, run by Checkly (`pnpm checkly:test` / `pnpm checkly:deploy`).
 * Read-only: never submits a form, so it cannot create leads.
 */
test("homepage renders", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("contact form is usable after hydration", async ({ page }) => {
  const res = await page.goto("/contact");
  expect(res?.status()).toBe(200);
  const form = page.locator("form").first();
  await expect(form).toBeVisible();
  await expect(form.locator('button[type="submit"]').first()).toBeEnabled();
});

test("sitemap responds", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("<urlset");
});
