import { test, expect } from "@playwright/test";

test("locale switcher navigates between DE and EN", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByText("Volleyball photography. Bremen.")).toBeVisible();

  await page.getByRole("button", { name: "DE", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();
});
