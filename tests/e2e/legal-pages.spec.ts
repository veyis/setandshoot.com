import { test, expect } from "@playwright/test";

test("Impressum page loads", async ({ page }) => {
  await page.goto("/impressum");
  await expect(page.getByRole("heading", { name: "Impressum" })).toBeVisible();
});

test("Datenschutz page loads", async ({ page }) => {
  await page.goto("/datenschutz");
  await expect(
    page.getByRole("heading", { name: /Datenschutzerklärung|Privacy|Datenschutz/i }),
  ).toBeVisible();
});
