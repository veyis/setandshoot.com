import { test, expect } from "@playwright/test";

test("home page renders the wordmark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "belin akguel" })).toBeVisible();
});
