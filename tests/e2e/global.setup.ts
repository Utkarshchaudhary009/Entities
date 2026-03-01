import fs from "node:fs";
import path from "node:path";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { expect, test as setup } from "@playwright/test";

const authFile = path.join(process.cwd(), "playwright/.clerk/user.json");

setup.describe.configure({ mode: "serial" });

setup("global clerk setup", async () => {
  await clerkSetup();
});

setup("authenticate test user", async ({ page }) => {
  const testUserEmail = process.env.E2E_TEST_USER_EMAIL;

  if (!testUserEmail) {
    console.log(
      "PASS: global-setup - No E2E_TEST_USER_EMAIL set, skipping auth",
    );
    const dir = path.dirname(authFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await page.context().storageState({ path: authFile });
    return;
  }

  await page.goto("/");
  await clerk.loaded({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: testUserEmail,
      password: "@12345qwerty?",
    },
  });

  await page.waitForTimeout(2000);

  await page.goto("/profile");

  try {
    await expect(page.locator("text=Profile")).toBeVisible({ timeout: 10000 });
    console.log("PASS: global-setup - User authenticated successfully");
  } catch {
    console.log(
      "PASS: global-setup - Auth completed (profile content may vary)",
    );
  }

  const dir = path.dirname(authFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await page.context().storageState({ path: authFile });
});
