import { test, expect } from "@playwright/test";

// Dev-mode Next.js cannot service many concurrent cold-paint requests cleanly;
// these routes intermittently return 500 under the default fullyParallel run
// when sibling test files are also compiling pages. Forcing this file serial
// removes within-file contention, and retries cover the cross-file pressure.
// Production builds (Vercel) do not hit this race.
test.describe.configure({ mode: "serial", retries: 2 });

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
