import { test, expect } from "@playwright/test";

test.describe("booking form", () => {
  test("submits successfully (network-intercepted) and shows the success state", async ({
    page,
  }) => {
    await page.route("**/api/booking", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.goto("/contact");
    await page.getByTestId("booking-form").waitFor();
    await page.fill("#booking-name", "Belin Akguel");
    await page.fill("#booking-email", "belin@example.com");
    await page.fill("#booking-message", "I would like to book a match-day shoot.");
    await page.click('button[type="submit"]');
    await expect(page.getByTestId("booking-success")).toBeVisible();
  });

  test("blocks submission with client-side validation errors", async ({ page }) => {
    let called = false;
    await page.route("**/api/booking", async (route) => {
      called = true;
      await route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
    });
    await page.goto("/contact");
    await page.getByTestId("booking-form").waitFor();
    await page.fill("#booking-name", "B");
    await page.fill("#booking-email", "not-an-email");
    await page.fill("#booking-message", "hi");
    await page.click('button[type="submit"]');
    await expect(page.locator("#booking-err-email")).toBeVisible();
    expect(called).toBe(false);
  });

  test("honeypot submission still shows success without erroring", async ({ page }) => {
    await page.route("**/api/booking", async (route) => {
      await route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
    });
    await page.goto("/contact");
    await page.fill("#booking-name", "Bot Name");
    await page.fill("#booking-email", "bot@example.com");
    await page.fill("#booking-message", "spam spam spam spam");
    await page.fill("#booking-company", "Spammer Inc");
    await page.click('button[type="submit"]');
    await expect(page.getByTestId("booking-success")).toBeVisible();
  });
});
