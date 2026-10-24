import { test, expect } from "@playwright/test";
import { mockProductsApi } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("mobile navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockProductsApi(page);
  });

  test("opens the sheet and closes with Escape", async ({ page }) => {
    await page.goto("/");

    const toggle = page.locator('button[aria-controls="mobile-navigation"]');
    const cart = page.getByRole("link", { name: "Cart (0 items)", exact: true });

    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-label", "Open navigation menu");
    await expect(cart).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();

    await toggle.click();

    const dialog = page.getByRole("dialog", { name: "Mobile navigation" });
    await expect(dialog).toBeVisible();

    const viewport = page.viewportSize();

    expect(viewport).not.toBeNull();

    if (viewport) {
      // The sheet slides up from below; wait for the spring to settle.
      await expect
        .poll(async () => {
          const settled = await dialog.boundingBox();
          return settled ? Math.round(settled.y + settled.height) : 0;
        })
        .toBeLessThanOrEqual(viewport.height + 1);

      const settled = await dialog.boundingBox();
      expect(settled?.y ?? -1).toBeGreaterThanOrEqual(0);
    }

    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(dialog.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Sign in" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("home page does not overflow horizontally", async ({ page }) => {
    await page.goto("/");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("navigates and marks the current route", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: "Open navigation menu" }).click();

    const dialog = page.getByRole("dialog", { name: "Mobile navigation" });
    const productsLink = dialog.getByRole("link", { name: "Products", exact: true });

    await expect(productsLink).toHaveAttribute("aria-current", "page");

    await dialog.getByRole("link", { name: "Categories", exact: true }).click();

    await expect(page).toHaveURL(/\/categories$/);
    await expect(dialog).toBeHidden();
  });

  test("shows account actions for signed-in users", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("accessToken", "mobile-access-token");
      localStorage.setItem("refreshToken", "mobile-refresh-token");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "mobile-user",
          email: "shopper@example.com",
          username: "shopper",
          role: "USER",
        }),
      );
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation menu" }).click();

    const dialog = page.getByRole("dialog", { name: "Mobile navigation" });

    await expect(dialog.getByText("shopper@example.com")).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Account", exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Logout" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  });
});
