import { test, expect } from "@playwright/test";

// /studio is gated like /admin: Neon Auth session + role=admin required.
// Unauthenticated visits are redirected to /sign-in with a `next` param.
test("unauthenticated /studio redirects to sign-in", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fstudio");
});

test("unauthenticated /studio/fotos redirects to sign-in", async ({ page }) => {
  await page.goto("/studio/fotos");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fstudio%2Ffotos");
});

test("unauthenticated /studio/stories redirects to sign-in", async ({ page }) => {
  await page.goto("/studio/stories");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fstudio%2Fstories");
});

test("unauthenticated /studio/seiten redirects to sign-in", async ({ page }) => {
  await page.goto("/studio/seiten");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fstudio%2Fseiten");
});

test("unauthenticated /studio/stammdaten redirects to sign-in", async ({ page }) => {
  await page.goto("/studio/stammdaten");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fstudio%2Fstammdaten");
});

test("unauthenticated /studio/rechtliches redirects to sign-in", async ({ page }) => {
  await page.goto("/studio/rechtliches");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fstudio%2Frechtliches");
});

test("unauthenticated /studio/einstellungen redirects to sign-in", async ({ page }) => {
  await page.goto("/studio/einstellungen");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fstudio%2Feinstellungen");
});

test("unauthenticated /en/studio redirects to sign-in", async ({ page }) => {
  await page.goto("/en/studio");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fen%2Fstudio");
});

test("unauthenticated /de/studio redirects to sign-in", async ({ page }) => {
  await page.goto("/de/studio");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fde%2Fstudio");
});

// Authenticated journey (upload photo → appears in grid) needs a Neon Auth
// test user — same blocker as the fixme in tests/e2e/auth.spec.ts. Until that
// fixture exists, the upload flow is verified manually (see the Fotos task).
test.fixme("admin can upload a photo and see it in the studio grid", () => {});
