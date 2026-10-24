import { test, expect } from "@playwright/test";
import { adminUser, mockProductsApi, seedCart } from "./helpers";

test.describe("authentication", () => {
  test.beforeEach(async ({ page }) => {
    await mockProductsApi(page);
  });

  test("login validates required fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("successful login stores tokens and redirects home", async ({ page }) => {
    await page.route(/\/auth\/login$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "User Logged in successfully",
          user: adminUser,
          accessToken: "access-token",
          refreshToken: "refresh-token",
        }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email address").fill("shopper@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Featured Products" })).toBeVisible();

    const tokens = await page.evaluate(() => ({
      access: localStorage.getItem("accessToken"),
      refresh: localStorage.getItem("refreshToken"),
      user: localStorage.getItem("user"),
    }));

    expect(tokens.access).toBe("access-token");
    expect(tokens.refresh).toBe("refresh-token");
    expect(tokens.user).toContain("shopper@example.com");
  });

  test("failed login shows the server message", async ({ page }) => {
    await page.route(/\/auth\/login$/, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "password does not match" }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email address").fill("shopper@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("password does not match")).toBeVisible();
  });
});

test.describe("cart", () => {
  test.beforeEach(async ({ page }) => {
    await mockProductsApi(page);
  });

  test("adding a product updates the cart and totals", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByText("Raiden Shogun Figure").first()).toBeVisible();

    await page.locator("button:has(i.fa-shopping-cart)").first().click({ force: true });

    await expect(page.locator("#cart span")).toHaveText("1", {
      timeout: 5_000,
    });

    await page.locator("#cart").click();
    await expect(page.getByRole("heading", { name: "Shopping Cart", level: 1 })).toBeVisible();
    await expect(page.getByText("Raiden Shogun Figure")).toBeVisible();
    await expect(page.getByText("$80.99").first()).toBeVisible();

    await page.getByRole("button", { name: "+" }).click();
    await expect(page.getByText("$161.98")).toBeVisible();

    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });

  test("checkout requires shipping details and calculates the order", async ({ page }) => {
    await seedCart(page);
    await page.goto("/checkout");

    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
    await expect(page.getByText("$161.98").first()).toBeVisible();
    await expect(
      page.getByText("Fill in your shipping information and continue to enable PayPal checkout."),
    ).toBeVisible();

    await page.getByLabel("First Name").fill("Ada");
    await page.getByLabel("Last Name").fill("Lovelace");
    await page.getByLabel("Email").fill("ada@example.com");
    await page.getByLabel("Address").fill("1 Analytical Engine Way");
    await page.getByLabel("City").fill("London");
    await page.getByLabel("State / Region").fill("London");
    await page.getByLabel("Postal Code").fill("EC1A");
    await page.getByLabel("Country").fill("United Kingdom");
    await page.getByRole("button", { name: "Continue to payment" }).click();

    await expect(
      page.getByText("Shipping details saved. Complete your payment below."),
    ).toBeVisible();
  });

  test("empty checkout links back to products", async ({ page }) => {
    await page.goto("/checkout");

    await expect(page.getByText("Your cart is empty")).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse products" })).toHaveAttribute(
      "href",
      "/products",
    );
  });
});
