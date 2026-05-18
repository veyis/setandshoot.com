import { test, expect } from "@playwright/test";

// /admin/* (including /admin/login) is gated behind Neon Auth.
// Unauthenticated visits are redirected to /sign-in before Payload's
// login form is ever rendered. Payload admins must also exist as
// Neon Auth users with role=admin.
test("unauthenticated /admin/login redirects to Neon Auth sign-in", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fadmin%2Flogin");
});
