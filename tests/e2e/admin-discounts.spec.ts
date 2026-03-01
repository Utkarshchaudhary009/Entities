import { expect, test } from "@playwright/test";

test.describe("Admin Discounts Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/discounts");
    await page.waitForLoadState("networkidle");
  });

  test("can interact with Add Discount drawer", async ({ page }) => {
    await page.getByRole("button", { name: "Add Discount" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Discount" }),
    ).toBeVisible();

    await page.fill('input[name="code"]', "TESTDISCOUNT");
    await page.fill('input[name="value"]', "10");

    // Test the cancel button
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Discount" }),
    ).toBeHidden();
  });

  test("can toggle discount status if exists", async ({ page }) => {
    const toggle = page.locator('button[role="switch"]').first();
    if (await toggle.isVisible()) {
      const initialState = await toggle.getAttribute("aria-checked");
      await toggle.click();
      await page.waitForTimeout(500);
      const newState = await toggle.getAttribute("aria-checked");
      expect(newState).not.toBe(initialState);
    }
  });

  test("can interact with Edit Discount drawer", async ({ page }) => {
    const editBtn = page.getByRole("button", { name: "Edit discount" }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(
        page.getByRole("heading", { name: "Edit Discount" }),
      ).toBeVisible();

      // Delete button check within the edit drawer
      const deleteBtn = page.getByRole("button", { name: "Delete discount" });
      await expect(deleteBtn).toBeVisible();

      await page.getByRole("button", { name: "Cancel" }).click();
    }
  });
});
