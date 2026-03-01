import { expect, test } from "@playwright/test";

test.describe("Admin Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("displays dashboard overview header", async ({ page }) => {
    try {
      const header = page.locator("h1", { hasText: "Dashboard Overview" });
      await expect(header).toBeVisible({ timeout: 10000 });
      console.log("PASS: admin-dashboard - Header is visible");
    } catch (error) {
      console.log("FAIL: admin-dashboard - Header not found");
      throw error;
    }
  });

  test("displays key stat cards", async ({ page }) => {
    try {
      // Check for presence of key stat titles
      const statTitles = [
        "Total Orders",
        "Total Revenue",
        "Pending Orders",
        "Active Discounts",
      ];

      for (const title of statTitles) {
        await expect(page.getByText(title, { exact: true })).toBeVisible({
          timeout: 5000,
        });
      }
      console.log("PASS: admin-dashboard-stats - Stat cards are visible");
    } catch (error) {
      console.log("FAIL: admin-dashboard-stats - Stat cards not found");
      throw error;
    }
  });

  test("displays recent orders section", async ({ page }) => {
    try {
      const recentOrdersHeader = page.getByText("Recent Orders", { exact: true });
      await expect(recentOrdersHeader).toBeVisible({ timeout: 5000 });
      console.log(
        "PASS: admin-dashboard-recent-orders - Recent Orders section is visible",
      );
    } catch (error) {
      console.log(
        "FAIL: admin-dashboard-recent-orders - Recent Orders section not found",
      );
      throw error;
    }
  });

  test("displays status breakdown section", async ({ page }) => {
    try {
      const statusBreakdownHeader = page.getByText("Status Breakdown", { exact: true });
      await expect(statusBreakdownHeader).toBeVisible({ timeout: 5000 });
      console.log(
        "PASS: admin-dashboard-status - Status Breakdown section is visible",
      );
    } catch (error) {
      console.log(
        "FAIL: admin-dashboard-status - Status Breakdown section not found",
      );
      throw error;
    }
  });
});
