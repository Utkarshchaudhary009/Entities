import { expect, test } from "@playwright/test";

test.describe("Admin Orders Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("networkidle");
  });

  test("displays orders header", async ({ page }) => {
    try {
      const header = page.locator("h1", { hasText: "Orders" });
      await expect(header).toBeVisible({ timeout: 10000 });
      console.log("PASS: admin-orders - Header is visible");
    } catch (error) {
      console.log("FAIL: admin-orders - Header not found");
      throw error;
    }
  });

  test("displays search input", async ({ page }) => {
    try {
      const searchInput = page.getByPlaceholder(
        "Search order #, customer, or email...",
      );
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      console.log("PASS: admin-orders-search - Search input is visible");
    } catch (error) {
      console.log("FAIL: admin-orders-search - Search input not found");
      throw error;
    }
  });

  test("displays table headers", async ({ page }) => {
    try {
      const customerHeader = page.getByText("Customer", { exact: true });
      await expect(customerHeader).toBeVisible({ timeout: 5000 });
      console.log("PASS: admin-orders-table - Customer header is visible");
    } catch (error) {
      console.log("FAIL: admin-orders-table - Customer header not found");
      throw error;
    }
  });
});
