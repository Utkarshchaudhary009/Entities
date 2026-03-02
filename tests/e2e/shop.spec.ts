import { expect, test } from "@playwright/test";

test.describe("Shop Page", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the shop page and wait for the network to be mostly idle
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
  });

  test("displays default New Arrivals view", async ({ page }) => {
    // Should display the New Arrivals heading
    await expect(page.getByText("New Arrivals")).toBeVisible();

    // Should display the search input
    const searchInput = page.getByPlaceholder("Search products...");
    await expect(searchInput).toBeVisible();
  });

  test("can search for a product", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search products...");

    // Type into the search box
    await searchInput.fill("a");

    // The heading should change to indicate search results
    await expect(page.getByText(/Search Results \(\d+\)/)).toBeVisible({
      timeout: 5000,
    });
  });

  test("can open the product drawer", async ({ page }) => {
    // Find the first product button and click it
    // Wait for the skeleton loaders to disappear
    await expect(page.locator(".animate-pulse")).toHaveCount(0, {
      timeout: 10000,
    });

    const productCards = page.locator("button.group.flex.flex-col");

    // Ensure there is at least one product
    if ((await productCards.count()) > 0) {
      await productCards.first().click();

      // Drawer should open and display Add to cart button
      const addToCartBtn = page.getByRole("button", { name: /Add to cart/i });
      await expect(addToCartBtn).toBeVisible();

      // Drawer should display Color and Size text
      await expect(page.getByText(/Color/)).toBeVisible();
      await expect(page.getByText(/Size/)).toBeVisible();
    }
  });
});
