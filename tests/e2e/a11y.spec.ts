import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility smoke test (axe-core, WCAG 2.2 A/AA rules).
 * Fails on critical violations; serious ones are attached to the report
 * so existing debt is visible without blocking unrelated work.
 *
 * "/" is the default (unprefixed) English locale; "/contact" hosts the
 * BookingForm, the site's main conversion page.
 */
const PAGES = ["/", "/contact"];

for (const path of PAGES) {
  test(`a11y: ${path}`, async ({ page }, testInfo) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const summarize = (impact: string) =>
      results.violations
        .filter((v) => v.impact === impact)
        .map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);

    const serious = summarize("serious");
    if (serious.length) {
      testInfo.annotations.push({ type: "serious a11y", description: serious.join("\n") });
    }
    expect(summarize("critical"), "critical axe violations").toEqual([]);
  });
}
