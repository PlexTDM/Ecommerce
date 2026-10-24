import { test, expect } from "@playwright/test";
import { adminUser, mockLoggedInAccount, mockProductsApi } from "./helpers";

test.describe("account", () => {
  test.beforeEach(async ({ page }) => {
    await mockProductsApi(page);
  });

  test("shows profile data, address book and order history", async ({ page }) => {
    await mockLoggedInAccount(page);
    await page.goto("/account");

    await expect(page.getByRole("heading", { name: "My Account", level: 1 })).toBeVisible();
    await expect(page.getByText(adminUser.email).first()).toBeVisible();
    await expect(page.getByText("Anime collector and coffee enthusiast.")).toBeVisible();
    await expect(page.getByText("Total orders")).toBeVisible();
    await expect(page.getByText("Saved addresses")).toBeVisible();

    await page.getByRole("tab", { name: "Addresses" }).click();
    await expect(page.getByRole("heading", { name: "Saved Addresses" })).toBeVisible();
    await expect(page.getByText("1 Sakura Street")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add address" })).toBeVisible();

    await page.getByRole("tab", { name: "Orders" }).click();
    await expect(page.getByRole("heading", { name: "Order History" })).toBeVisible();
    await expect(page.getByText("COMPLETED")).toBeVisible();
    await expect(page.getByText("$80.99").first()).toBeVisible();

    await page.getByRole("tab", { name: "Settings" }).click();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  });

  test("address editor is a viewport-wide modal and saves", async ({ page }) => {
    await mockLoggedInAccount(page);
    await page.goto("/account");
    await page.getByRole("tab", { name: "Addresses" }).click();
    await page.getByRole("button", { name: "Add address" }).click();

    const dialog = page.getByRole("dialog", { name: "Add New Address" });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel("Street address")).toBeFocused();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    const backdropBox = await page
      .getByRole("button", { name: "Close address editor" })
      .boundingBox();
    const dialogBox = await dialog.boundingBox();
    const viewport = page.viewportSize();

    expect(backdropBox).not.toBeNull();
    expect(dialogBox).not.toBeNull();
    expect(viewport).not.toBeNull();

    if (backdropBox && dialogBox && viewport) {
      expect(backdropBox.x).toBe(0);
      expect(backdropBox.y).toBe(0);
      expect(backdropBox.width).toBe(viewport.width);
      expect(backdropBox.height).toBe(viewport.height);
      expect(dialogBox.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox.y).toBeGreaterThanOrEqual(0);
      expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(viewport.width);
      expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height);
    }

    await page.getByLabel("Street address").fill("2 Sakura Avenue");
    await page.getByLabel("City").fill("Osaka");
    await page.getByLabel("State / Region").fill("Osaka");
    await page.getByLabel("ZIP / Postal code").fill("530-0001");
    await page.getByLabel("Country").fill("Japan");
    await dialog.getByRole("button", { name: "Add address" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("2 Sakura Avenue")).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("address editor closes with Escape", async ({ page }) => {
    await mockLoggedInAccount(page);
    await page.goto("/account");
    await page.getByRole("tab", { name: "Addresses" }).click();
    await page.getByRole("button", { name: "Add address" }).click();

    const dialog = page.getByRole("dialog", { name: "Add New Address" });
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("unauthenticated visitors are prompted to sign in", async ({ page }) => {
    await page.goto("/account");

    await expect(
      page.getByRole("heading", {
        name: "Sign in to view your account",
        level: 1,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });
});
