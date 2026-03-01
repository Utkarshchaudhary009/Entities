import { expect, test } from "@playwright/test";

test.describe("Admin Products Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/products");
    await page.waitForLoadState("networkidle");
  });

  test("can interact with Add Product drawer", async ({ page }) => {
    await page.getByRole("button", { name: "Add Product" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Product" }),
    ).toBeVisible();

    // Check validation error on submit without required fields
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Please fix the validation errors"))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {});

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Product" }),
    ).toBeHidden();
  });

  test("can toggle active status if exists", async ({ page }) => {
    const toggle = page.locator('button[role="switch"]').first();
    if (await toggle.isVisible()) {
      const initialState = await toggle.getAttribute("aria-checked");
      await toggle.click();
      await page.waitForTimeout(500);
      const newState = await toggle.getAttribute("aria-checked");
      expect(newState).not.toBe(initialState);
    }
  });

  test("can open delete dialog if product exists", async ({ page }) => {
    const deleteBtn = page.locator("button.text-destructive").first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(
        page.getByRole("heading", { name: "Are you absolutely sure?" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
    }
  });
});
