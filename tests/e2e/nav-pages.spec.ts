import { test, expect } from "@playwright/test";

const routes = [
  "/stories",
  "/highlights",
  "/athletes",
  "/about",
  "/services",
  "/journal",
  "/contact",
];

for (const route of routes) {
  test(`${route} returns 200`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(400);
  });
}
