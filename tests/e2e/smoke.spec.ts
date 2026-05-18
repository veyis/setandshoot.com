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
