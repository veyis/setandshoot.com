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

/**
 * AUTHENTICATED UPLOAD JOURNEY — writes to the shared Neon DB.
 *
 * The uploader now uses the presigned direct-to-R2 flow (presign → PUT straight
 * to R2 → finalize), so driving the file input here also exercises that R2
 * round-trip end-to-end against the configured (preview) bucket.
 *
 * This describe block is SKIPPED by default. It only runs when both
 * TEST_EMAIL and TEST_PASSWORD env vars are set.
 *
 * Run order:
 *   1. pnpm tsx scripts/experiments/studio-e2e-setup.ts
 *   2. TEST_EMAIL=… TEST_PASSWORD=… pnpm exec playwright test tests/e2e/studio.spec.ts
 *   3. pnpm tsx scripts/experiments/studio-e2e-cleanup.ts
 *
 * The uploaded file is named "studio-smoke-test-bitte-loeschen.jpg" so the
 * cleanup script can find and delete it from the `photos` collection.
 */
test.describe("studio upload (authenticated)", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !process.env.TEST_EMAIL || !process.env.TEST_PASSWORD,
    "set TEST_EMAIL and TEST_PASSWORD (and run scripts/experiments/studio-e2e-setup.ts first) to run the authenticated upload journey",
  );

  test("admin can upload a photo and see it in the studio grid", async ({ page }) => {
    // -- Step 1: log in --
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(process.env.TEST_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_PASSWORD!);
    await page.getByRole("button", { name: /^log ?in$/i }).click();
    await page.waitForURL((url) => !url.pathname.endsWith("/sign-in"), {
      timeout: 20_000,
    });

    // -- Step 2: navigate to fotos grid --
    await page.goto("/studio/fotos");
    await expect(page.getByRole("heading", { name: /fotos/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    // -- Step 3: count existing cards --
    const before = await page.locator("main ul li").count();

    // -- Step 4: upload a minimal 1×1 JPEG from memory --
    const b64 =
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AfwD/2Q==";
    const jpeg = Buffer.from(b64, "base64");
    await page.locator('input[type="file"]').setInputFiles({
      name: "studio-smoke-test-bitte-loeschen.jpg",
      mimeType: "image/jpeg",
      buffer: jpeg,
    });

    // -- Step 5: wait for upload success indicator --
    await expect(page.getByText(/^(Hochgeladen|Uploaded)$/)).toBeVisible({
      timeout: 30_000,
    });

    // -- Step 6: assert the grid grew and the new card carries the derived alt --
    // Photos sort newest-first, so the just-uploaded photo is the first card.
    // Use toHaveValue (reads the .value property), not an [value="…"] CSS
    // attribute selector — PhotoCard is a controlled React input whose attribute
    // does not reflect the property after hydration. The filename slug
    // "studio-smoke-test-bitte-loeschen.jpg" derives the alt "studio smoke test
    // bitte loeschen".
    await expect
      .poll(async () => page.locator("main ul li").count(), { timeout: 15_000 })
      .toBeGreaterThan(before);

    const newestAltDe = page.locator("main ul li").first().getByRole("textbox").first();
    await expect(newestAltDe).toHaveValue("studio smoke test bitte loeschen", {
      timeout: 15_000,
    });
  });
});
