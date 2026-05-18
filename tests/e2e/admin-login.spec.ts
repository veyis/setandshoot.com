import { test, expect } from "@playwright/test";

test("admin login page renders", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByLabel(/password/i)).toBeVisible({ timeout: 15000 });
});
