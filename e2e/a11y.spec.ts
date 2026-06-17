import AxeBuilder from "@axe-core/playwright";

import { test, expect } from "@playwright/test";

/**
 * Accessibility scans on key routes. We fail only on serious/critical
 * violations to keep the gate actionable; tighten to all impacts over time.
 */
async function scan(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  return results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
}

test.describe("Accessibility", () => {
  test("/auth has no serious or critical violations", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    const violations = await scan(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
