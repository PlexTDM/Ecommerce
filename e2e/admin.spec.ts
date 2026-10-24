import { test, expect, type Page } from "@playwright/test";
import type { Product } from "../src/types";
import type {
  AdminOrder,
  AdminOrdersResponse,
  AdminProductsResponse,
  AdminStats,
} from "../src/types/admin";
import { adminUser, mockProductsApi, ordersFixture, testProduct } from "./helpers";

const adminAccount = {
  ...adminUser,
  email: "admin@animerch.test",
  username: "admin",
  role: "ADMIN" as const,
};

const statsFixture: AdminStats = {
  products: 1,
  orders: 1,
  revenue: "80.99",
  pendingOrders: 0,
  lowStock: 0,
};

interface AdminMockState {
  products: Product[];
  orders: AdminOrder[];
}

async function mockAdminApi(page: Page): Promise<AdminMockState> {
  const state: AdminMockState = {
    products: [testProduct],
    orders: ordersFixture as AdminOrder[],
  };

  await page.addInitScript(
    ({ user }) => {
      localStorage.setItem("accessToken", "admin-access-token");
      localStorage.setItem("refreshToken", "admin-refresh-token");
      localStorage.setItem("user", JSON.stringify(user));
    },
    { user: adminAccount },
  );

  await page.route(/\/admin\/stats$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(statsFixture),
    });
  });

  await page.route(/\/admin\/products(\?.*)?$/, async (route) => {
    if (route.request().method() === "POST") {
      const payload = route.request().postDataJSON() as Partial<Product>;
      const created: Product = {
        ...testProduct,
        ...payload,
        _id: "admin-created-product",
        id: "admin-created-product",
        title: payload.title ?? "Admin created product",
        ratings: [],
      };

      state.products = [created, ...state.products];

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(created),
      });
      return;
    }

    const response: AdminProductsResponse = {
      page: 1,
      limit: 20,
      totalPages: 1,
      totalProducts: state.products.length,
      products: state.products,
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });

  await page.route(/\/admin\/products\/[^/?]+$/, async (route) => {
    const method = route.request().method();
    const id = new URL(route.request().url()).pathname.split("/").pop();

    if (method === "DELETE") {
      state.products = state.products.filter((product) => product._id !== id);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Product deleted" }),
      });
      return;
    }

    if (method === "PUT") {
      const payload = route.request().postDataJSON() as Partial<Product>;
      const index = state.products.findIndex((product) => product._id === id);

      if (index === -1) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Product not found" }),
        });
        return;
      }

      const updated = { ...state.products[index], ...payload } as Product;
      state.products[index] = updated;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updated),
      });
      return;
    }

    await route.fulfill({ status: 405, body: "" });
  });

  await page.route(/\/admin\/orders(\?.*)?$/, async (route) => {
    const response: AdminOrdersResponse = {
      page: 1,
      limit: 20,
      totalPages: 1,
      totalOrders: state.orders.length,
      orders: state.orders,
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });

  await page.route(/\/admin\/orders\/[^/?]+\/status$/, async (route) => {
    const id = new URL(route.request().url()).pathname.split("/").at(-2);
    const payload = route.request().postDataJSON() as { status?: AdminOrder["status"] };
    const index = state.orders.findIndex((order) => order._id === id);

    if (index === -1 || !payload.status) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Order not found" }),
      });
      return;
    }

    const updated = { ...state.orders[index], status: payload.status } as AdminOrder;
    state.orders[index] = updated;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(updated),
    });
  });

  return state;
}

test.describe("admin dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockProductsApi(page);
  });

  test("shows overview metrics", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Store dashboard", level: 1 })).toBeVisible();
    await expect(page.getByText("Pending orders")).toBeVisible();
    await expect(page.getByText("Low stock")).toBeVisible();
    await expect(page.getByText("$80.99").first()).toBeVisible();
  });

  test("creates a product from the products tab", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin");

    await page.getByRole("tab", { name: "Products" }).click();
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByText(testProduct.title).first()).toBeVisible();

    await page.getByRole("button", { name: "New product" }).click();

    const dialog = page.getByRole("dialog", { name: "New product" });
    await expect(dialog).toBeVisible();

    await page.getByLabel("Title").fill("Admin Test Figure");
    await page.getByLabel("Price (USD)").fill("42.50");
    await page.getByLabel("Main image").fill("https://example.com/admin-test.jpg");
    await page.getByLabel("Tags").fill("admin, figure");
    await dialog.getByRole("button", { name: "Create product" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("Admin Test Figure").first()).toBeVisible();
  });

  test("updates an order status", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin");

    await page.getByRole("tab", { name: "Orders" }).click();
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

    const statusSelect = page.getByRole("combobox", {
      name: /Update order status/,
    });
    await expect(statusSelect).toHaveValue("COMPLETED");
    await statusSelect.selectOption("PENDING");

    await expect(statusSelect).toHaveValue("PENDING");
    await expect(
      page.locator("tbody span").getByText("PENDING", { exact: true }).first(),
    ).toBeVisible();
  });

  test("non-admin users are blocked", async ({ page }) => {
    await page.addInitScript(
      ({ user }) => {
        localStorage.setItem("accessToken", "user-access-token");
        localStorage.setItem("refreshToken", "user-refresh-token");
        localStorage.setItem("user", JSON.stringify(user));
      },
      { user: adminUser },
    );

    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: "Admin access required", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to store" })).toBeVisible();
  });
});
