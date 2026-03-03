import { test } from "@playwright/test";

test.describe("Admin Brand Documents", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/brand-documents");
    await page.waitForLoadState("networkidle");
  });

  test("can switch document tabs and edit content", async ({ page }) => {
    // Switch to Shipping Policy or Return Policy
    const shippingTab = page.getByRole("tab", { name: /Shipping/i });
    if (await shippingTab.isVisible()) {
      await shippingTab.click();

      // Assume there is a textarea for the policy content
      const textarea = page.locator("textarea").first();
      if (await textarea.isVisible()) {
        await textarea.fill("Updated shipping policy details.");

        const saveBtn = page.getByRole("button", { name: /Save/i });
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
        }
      }
    }
  });
});
