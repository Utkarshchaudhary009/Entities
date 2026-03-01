import { expect, test } from "@playwright/test";

test.describe("Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
  });

  test("displays profile hero section with user info", async ({ page }) => {
    // ProfileHero shows user image and email when authenticated
    const userImage = page.locator("img.rounded-full");
    const userEmail = page.locator("p.text-sm.text-muted-foreground");

    try {
      // Wait for user image to be visible (indicates session loaded and user exists)
      await expect(userImage).toBeVisible({ timeout: 15000 });

      // Check email is visible (always present for Clerk users)
      await expect(userEmail).toBeVisible({ timeout: 5000 });
      await expect(userEmail).toHaveText(/.+@.+/, { timeout: 5000 });

      console.log(
        "PASS: profile-hero - Profile hero section with user info is visible",
      );
    } catch (error) {
      console.log("FAIL: profile-hero - Profile hero section not visible");
      throw error;
    }
  });

  test("displays dark mode toggle", async ({ page }) => {
    const darkModeToggle = page.getByRole("switch");

    try {
      await expect(darkModeToggle).toBeVisible({ timeout: 10000 });
      console.log("PASS: dark-mode-toggle - Dark mode switch is visible");
    } catch (error) {
      console.log("FAIL: dark-mode-toggle - Dark mode switch not found");
      throw error;
    }
  });

  test("can toggle dark mode", async ({ page }) => {
    const darkModeToggle = page.getByRole("switch");

    try {
      await expect(darkModeToggle).toBeVisible({ timeout: 10000 });

      const initialState = await darkModeToggle.getAttribute("data-state");
      await darkModeToggle.click();

      await page.waitForTimeout(500);

      const newState = await darkModeToggle.getAttribute("data-state");
      expect(newState).not.toBe(initialState);
      console.log("PASS: dark-mode-toggle-click - Dark mode toggle works");
    } catch (error) {
      console.log("FAIL: dark-mode-toggle-click - Dark mode toggle failed");
      throw error;
    }
  });

  test("displays all menu items", async ({ page }) => {
    const menuItems = [
      "My Orders",
      "My Coupons",
      "Addresses",
      "Notifications",
      "Legal & Policies",
      "Help & Support",
    ];

    try {
      for (const item of menuItems) {
        const menuItem = page.getByText(item, { exact: true });
        await expect(menuItem).toBeVisible({ timeout: 5000 });
      }
      console.log("PASS: menu-items - All profile menu items are visible");
    } catch (error) {
      console.log("FAIL: menu-items - Not all menu items are visible");
      throw error;
    }
  });

  test("displays logout button", async ({ page }) => {
    const logoutButton = page.getByRole("button", { name: /log out/i });

    try {
      await expect(logoutButton).toBeVisible({ timeout: 10000 });
      console.log("PASS: logout-button - Logout button is visible");
    } catch (error) {
      console.log("FAIL: logout-button - Logout button not found");
      throw error;
    }
  });

  test("navigates to orders page", async ({ page }) => {
    try {
      const ordersLink = page.locator('a[href="/profile/orders"]');
      await expect(ordersLink).toBeVisible({ timeout: 10000 });
      await ordersLink.click();

      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/profile\/orders/, { timeout: 15000 });

      // Verify orders page content loaded
      const ordersHeader = page.locator("h2").filter({ hasText: "My Orders" });
      await expect(ordersHeader).toBeVisible({ timeout: 10000 });

      console.log("PASS: orders-navigation - Navigation to orders page works");
    } catch (error) {
      console.log("FAIL: orders-navigation - Navigation to orders page failed");
      throw error;
    }
  });

  test("navigates to coupons page", async ({ page }) => {
    try {
      const couponsLink = page.locator('a[href="/profile/coupons"]');
      await expect(couponsLink).toBeVisible({ timeout: 10000 });
      await couponsLink.click();

      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/profile\/coupons/, { timeout: 15000 });

      console.log(
        "PASS: coupons-navigation - Navigation to coupons page works",
      );
    } catch (error) {
      console.log(
        "FAIL: coupons-navigation - Navigation to coupons page failed",
      );
      throw error;
    }
  });

  test("navigates to addresses page", async ({ page }) => {
    try {
      const addressesLink = page.locator('a[href="/profile/addresses"]');
      await expect(addressesLink).toBeVisible({ timeout: 10000 });
      await addressesLink.click();

      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/profile\/addresses/, { timeout: 15000 });

      console.log(
        "PASS: addresses-navigation - Navigation to addresses page works",
      );
    } catch (error) {
      console.log(
        "FAIL: addresses-navigation - Navigation to addresses page failed",
      );
      throw error;
    }
  });

  test("navigates to notifications page", async ({ page }) => {
    try {
      const notificationsLink = page.locator(
        'a[href="/profile/notifications"]',
      );
      await expect(notificationsLink).toBeVisible({ timeout: 10000 });
      await notificationsLink.click();

      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/profile\/notifications/, {
        timeout: 15000,
      });

      console.log(
        "PASS: notifications-navigation - Navigation to notifications page works",
      );
    } catch (error) {
      console.log(
        "FAIL: notifications-navigation - Navigation to notifications page failed",
      );
      throw error;
    }
  });

  test("navigates to legal page", async ({ page }) => {
    try {
      const legalLink = page.locator('a[href="/profile/legal"]');
      await expect(legalLink).toBeVisible({ timeout: 10000 });
      await legalLink.click();

      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/profile\/legal/, { timeout: 15000 });

      console.log("PASS: legal-navigation - Navigation to legal page works");
    } catch (error) {
      console.log("FAIL: legal-navigation - Navigation to legal page failed");
      throw error;
    }
  });

  test("navigates to support page", async ({ page }) => {
    try {
      const supportLink = page.locator('a[href="/profile/support"]');
      await expect(supportLink).toBeVisible({ timeout: 10000 });
      await supportLink.click();

      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/profile\/support/, { timeout: 15000 });

      console.log(
        "PASS: support-navigation - Navigation to support page works",
      );
    } catch (error) {
      console.log(
        "FAIL: support-navigation - Navigation to support page failed",
      );
      throw error;
    }
  });

  test("mobile header is visible on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    try {
      const mobileHeader = page.locator("h1").filter({ hasText: "Profile" });
      await expect(mobileHeader).toBeVisible({ timeout: 5000 });
      console.log("PASS: mobile-header - Mobile profile header is visible");
    } catch (error) {
      console.log("FAIL: mobile-header - Mobile header not visible");
      throw error;
    }
  });

  test("logout button has destructive styling", async ({ page }) => {
    const logoutButton = page.getByRole("button", { name: /log out/i });

    try {
      await expect(logoutButton).toBeVisible({ timeout: 10000 });

      // Check for destructive variant class (text-destructive is the indicator)
      await expect(logoutButton).toHaveClass(/text-destructive/);
      console.log(
        "PASS: logout-styling - Logout button has destructive styling",
      );
    } catch (error) {
      console.log(
        "FAIL: logout-styling - Logout button missing destructive styling",
      );
      throw error;
    }
  });

  test("dark mode label text is visible", async ({ page }) => {
    try {
      const darkModeLabel = page.getByText("Dark Mode", { exact: true });
      await expect(darkModeLabel).toBeVisible({ timeout: 5000 });
      console.log("PASS: dark-mode-label - Dark Mode label is visible");
    } catch (error) {
      console.log("FAIL: dark-mode-label - Dark Mode label not found");
      throw error;
    }
  });
});
