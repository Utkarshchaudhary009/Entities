import { expect, test } from "@playwright/test";

test.describe("Admin Categories Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/categories");
    await page.waitForLoadState("networkidle");
  });

  test("can interact with Add Category drawer", async ({ page }) => {
    await page.getByRole("button", { name: "Add Category" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Category" }),
    ).toBeVisible();

    await page.fill('input[name="name"]', "Test Category");

    // Test the cancel button
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Category" }),
    ).toBeHidden();
  });

  test("can toggle category status if exists", async ({ page }) => {
    const toggle = page.locator('button[role="switch"]').first();
    if (await toggle.isVisible()) {
      const initialState = await toggle.getAttribute("aria-checked");
      await toggle.click();
      await page.waitForTimeout(500);
      const newState = await toggle.getAttribute("aria-checked");
      expect(newState).not.toBe(initialState);
    }
  });

  test("can interact with Edit Category drawer", async ({ page }) => {
    const editBtn = page.getByRole("button", { name: "Edit category" }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(
        page.getByRole("heading", { name: "Edit Category" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
    }
  });
});
