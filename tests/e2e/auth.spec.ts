import { test, expect } from "@playwright/test";

test.describe("Neon Auth gate", () => {
  test("unauthenticated /admin redirects to /sign-in with next param", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in/);
    expect(page.url()).toContain("next=%2Fadmin");
  });

  test("unauthenticated /account redirects to /sign-in with next param", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/sign-in/);
    expect(page.url()).toContain("next=%2Faccount");
  });

  test("unauthenticated /account/bookings redirects to /sign-in", async ({ page }) => {
    await page.goto("/account/bookings");
    await expect(page).toHaveURL(/\/sign-in/);
    expect(page.url()).toContain("next=%2Faccount%2Fbookings");
  });
});

test.describe("Neon Auth UI", () => {
  test("sign-in page renders email and password fields", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/password/i)).toBeVisible({ timeout: 15_000 });
  });

  test("sign-up page renders email and password fields", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/password/i)).toBeVisible({ timeout: 15_000 });
  });
});

// Full sign-up → account → sign-out flow needs a Neon Auth test user.
// Skipped until we wire either (a) a Neon Auth test-mode hook that bypasses
// email verification, or (b) a teardown that deletes the test user after.
test.fixme("authenticated user can submit a booking and see it on /account/bookings", () => {});
