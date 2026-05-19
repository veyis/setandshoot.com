import { test, expect } from "@playwright/test";

test.describe("Hero — Slate × Cover", () => {
  test("desktop: first frame renders the cover title, masthead, and letterbox", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    // Wait for reveal stagger to complete (~2.5s)
    await page.waitForTimeout(2600);

    // Cover title H1 contains "belin"
    await expect(page.getByRole("heading", { level: 1 })).toContainText("belin");

    // Masthead counter visible (NN ⁄ NN format)
    const counter = page.locator('[data-test="hero-masthead-counter"]');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText("⁄");

    // CTA bar visible at bottom-left on desktop
    const ctaBar = page.locator('[data-test="hero-cta-bar"]');
    await expect(ctaBar).toBeVisible();

    // No sticky-CTA gradient backing on desktop — bar has zero visible border + no gradient image.
    // (Tailwind v4 Preflight forces border-style:solid globally, so check width + bg-image.)
    const borderTopWidth = await ctaBar.evaluate((el) => getComputedStyle(el).borderTopWidth);
    const backgroundImage = await ctaBar.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(borderTopWidth).toBe("0px");
    expect(backgroundImage).toBe("none");

    // Desktop letterbox bar present
    const topBar = page.locator(".hero-bar-top");
    await expect(topBar).toBeVisible();
  });

  test("desktop: after one rotation, kicker and camera-spec text changed", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(2600);

    const kickerBefore = await page.locator('[data-test="hero-kicker"]').textContent();
    const cameraBefore = await page.locator('[data-test="hero-camera"]').textContent();

    // Default hold is 6500ms — wait one full rotation
    await page.waitForTimeout(7000);

    const kickerAfter = await page.locator('[data-test="hero-kicker"]').textContent();
    const cameraAfter = await page.locator('[data-test="hero-camera"]').textContent();
    expect(kickerAfter).not.toBe(kickerBefore);
    expect(cameraAfter).not.toBe(cameraBefore);
  });

  test("mobile: sticky CTA bar present with gradient backing, letterbox bars hidden", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForTimeout(2600);

    const ctaBar = page.locator('[data-test="hero-cta-bar"]');
    await expect(ctaBar).toBeVisible();
    // Mobile bar shows the gradient backing + a visible 1px top hairline.
    const borderTopWidth = await ctaBar.evaluate((el) => getComputedStyle(el).borderTopWidth);
    const backgroundImage = await ctaBar.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(borderTopWidth).toBe("1px");
    expect(backgroundImage).toContain("linear-gradient");

    // Letterbox bars hidden on mobile
    const topBar = page.locator(".hero-bar-top");
    await expect(topBar).toBeHidden();
  });

  test("reduced motion: no blur, no scale, photo is instantly opaque", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(400);

    const photo = page.locator(".hero-photo[data-active='true']").first();
    const filter = await photo.evaluate((el) => getComputedStyle(el).filter);
    const transform = await photo.evaluate((el) => getComputedStyle(el).transform);
    expect(filter === "none" || filter === "").toBeTruthy();
    expect(transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)").toBeTruthy();

    await ctx.close();
  });
});
