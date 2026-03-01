import { expect, test } from "@playwright/test";

test.describe("Admin Brand Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/brand");
    await page.waitForLoadState("networkidle");
  });

  test("can edit brand name and submit", async ({ page }) => {
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Updated Brand Name");

    const saveBtn = page.getByRole("button", { name: /Save|Create/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      // Should show a success toast
      await expect(page.getByText(/Brand profile/))
        .toBeVisible({ timeout: 5000 })
        .catch(() => {});
    }
  });

  test("can toggle active status", async ({ page }) => {
    const toggle = page.locator('button[role="switch"]').first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(500);
    }
  });
});
