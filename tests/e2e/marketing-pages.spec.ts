import { expect, test } from "@playwright/test";

for (const path of ["contact", "services", "athletes", "highlights"]) {
  test(`/${path} renders an editable H1 from its global`, async ({ page }) => {
    await page.goto(`/${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}
