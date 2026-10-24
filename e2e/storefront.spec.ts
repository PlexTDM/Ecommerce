import { test, expect } from "@playwright/test";
import {
  expectPageHeading,
  expectProductVisible,
  mockProductsApi,
  secondProduct,
  testProduct,
} from "./helpers";

test.describe("storefront", () => {
  test.beforeEach(async ({ page }) => {
    await mockProductsApi(page);
  });

  test("home renders the hero, featured products and navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Featured Products" })).toBeVisible();
    await expectProductVisible(page);
    await expect(page.getByRole("link", { name: "AniMerch" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shop by Category" })).toBeVisible();
  });

  test("primary navigation reaches every storefront page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Products", exact: true }).first().click();
    await expect(page).toHaveURL(/\/products$/);
    await expectProductVisible(page);

    await page.getByRole("link", { name: "Categories", exact: true }).first().click();
    await expect(page).toHaveURL(/\/categories$/);
    await expectPageHeading(page, "Shop by Category");

    await page.getByRole("link", { name: "Contact", exact: true }).first().click();
    await expect(page).toHaveURL(/\/contact$/);
    await expectPageHeading(page, "Contact us");
  });

  test("unknown routes show the 404 page", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expectPageHeading(page, "Page not found");
    await expect(page.getByRole("link", { name: "Go back home" })).toBeVisible();
  });

  test("product detail renders server data", async ({ page }) => {
    await page.goto("/product/6adc50615c949c7a1efaa3c3");

    await expectProductVisible(page);
    await expect(
      page.getByRole("heading", { name: "Raiden Shogun Figure", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("A highly detailed collectible figure.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to Cart" })).toBeEnabled();
  });

  test("gallery next/prev select the image and move the swiper", async ({ page }) => {
    await page.goto(`/product/${testProduct._id}`);

    const prev = page.getByRole("button", {
      name: "Previous product image",
    });
    const next = page.getByRole("button", { name: "Next product image" });
    const mainImage = page.locator(".EasyZoomImageHoverMainContainer img").first();
    const zoomContainer = page.locator(".EasyZoomImageHoverMainContainer").first();

    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();
    await expect(mainImage).toHaveAttribute("src", /^data:image\/svg/);
    await expect(zoomContainer).toBeVisible();
    await expect(zoomContainer).toHaveCSS("width", "500px");
    await expect(zoomContainer).toHaveCSS("height", "600px");

    const wrapper = page.locator(".swiper-vertical .swiper-wrapper").first();
    const initialTransform = await wrapper.evaluate(
      (element) => (element as HTMLElement).style.transform,
    );

    await next.click();

    await expect(page.getByRole("button", { name: "View image 2", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(mainImage).toHaveAttribute("src", /raiden-1\.jpg/);
    // A cached/loading image must not hit the 1.6s default reveal delay.
    await expect(zoomContainer).toBeVisible({ timeout: 1500 });
    await expect(zoomContainer).toHaveCSS("width", "500px");
    await expect(zoomContainer).toHaveCSS("height", "600px");
    await expect
      .poll(async () => wrapper.evaluate((element) => (element as HTMLElement).style.transform))
      .not.toBe(initialTransform);
    await expect(prev).toBeEnabled();

    await prev.click();

    await expect(page.getByRole("button", { name: "View image 1", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(mainImage).toHaveAttribute("src", /^data:image\/svg/);
    await expect
      .poll(async () => wrapper.evaluate((element) => (element as HTMLElement).style.transform))
      .toBe(initialTransform);
    await expect(prev).toBeDisabled();
  });

  test("revisiting an image uses the cached resource", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("raiden-1.jpg")) {
        requests.push(request.url());
      }
    });

    await page.goto(`/product/${testProduct._id}`);

    const prev = page.getByRole("button", {
      name: "Previous product image",
    });
    const next = page.getByRole("button", { name: "Next product image" });
    const mainImage = page.locator(".EasyZoomImageHoverMainContainer img").first();

    await next.click();
    await expect(mainImage).toHaveAttribute("src", /raiden-1\.jpg/);
    await expect(page.locator(".EasyZoomImageHoverMainContainer").first()).toBeVisible();
    await page.waitForTimeout(400);
    const requestCount = requests.length;

    expect(requestCount).toBeGreaterThan(0);

    await prev.click();
    await expect(mainImage).toHaveAttribute("src", /^data:image\/svg/);
    await next.click();
    await expect(mainImage).toHaveAttribute("src", /raiden-1\.jpg/);
    await expect(page.locator(".EasyZoomImageHoverMainContainer").first()).toBeVisible();
    await page.waitForTimeout(400);

    expect(requests.length).toBe(requestCount);
  });

  test("switching products replaces the stale gallery slides", async ({ page }) => {
    await mockProductsApi(page, [testProduct, secondProduct]);
    await page.goto("/products");

    await page.getByRole("link", { name: testProduct.title }).first().click();
    await expect(page.getByRole("heading", { name: testProduct.title, level: 1 })).toBeVisible();
    await expect(page.locator('img[src*="raiden-1.jpg"]')).toHaveCount(1);

    await page.goBack();
    await page.getByRole("link", { name: secondProduct.title }).first().click();

    await expect(page.getByRole("heading", { name: secondProduct.title, level: 1 })).toBeVisible();
    await expect(page.locator('img[src*="makima-1.jpg"]')).toHaveCount(1);
    await expect(page.locator('img[src*="raiden-1.jpg"]')).toHaveCount(0);
  });
});
