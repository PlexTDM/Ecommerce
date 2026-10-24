import { expect, type Page } from "@playwright/test";
import type { Order, Product, ProductsResponse, Profile, PublicUser } from "../src/types";

const pixel =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='500' height='600'><rect width='500' height='600' fill='%236366f1'/></svg>";

export const galleryImages = Array.from({ length: 10 }, (_, index) => `raiden-${index + 1}.jpg`);

export const testProduct: Product = {
  _id: "6adc50615c949c7a1efaa3c3",
  id: "fixture-product",
  title: "Raiden Shogun Figure",
  price: 89.99,
  discount: 10,
  image: pixel,
  moreImages: galleryImages,
  tags: ["figure", "anime"],
  inStock: true,
  isNewProduct: true,
  ratings: [{ stars: 5, count: 12 }],
  description: {
    body1: "A highly detailed collectible figure.",
    body2: "Ships in protective packaging.",
  },
};

const buildProductsResponse = (products: Product[]): ProductsResponse => ({
  page: 1,
  limit: 40,
  totalPages: 1,
  totalProducts: {
    all: products.length,
    discount: products.filter((product) => Boolean(product.discount)).length,
    inStock: products.filter((product) => product.inStock).length,
    isNewProduct: products.filter((product) => product.isNewProduct).length,
    lessThan: {
      10: products.filter((product) => product.price <= 10).length,
      20: products.filter((product) => product.price <= 20).length,
      50: products.filter((product) => product.price <= 50).length,
      100: products.filter((product) => product.price <= 100).length,
    },
  },
  products,
});

export const productsResponse = buildProductsResponse([testProduct]);

export const secondProduct: Product = {
  ...testProduct,
  _id: "6adc50615c949c7a1efaa3c5",
  id: "fixture-product-2",
  title: "Makima Figure",
  price: 74.99,
  discount: null,
  isNewProduct: false,
  moreImages: ["makima-1.jpg", "makima-2.jpg"],
  tags: ["figure", "chainsaw-man"],
};

export const adminUser: PublicUser = {
  id: "6adc50615c949c7a1efaa3c4",
  email: "shopper@example.com",
  username: "shopper",
  role: "USER",
};

export const profileFixture: Profile = {
  bio: "Anime collector and coffee enthusiast.",
  userId: adminUser.id,
  addresses: [
    {
      id: "address-1",
      street: "1 Sakura Street",
      city: "Tokyo",
      state: "Tokyo",
      zip: "100-0001",
      country: "Japan",
    },
  ],
};

export const ordersFixture: Order[] = [
  {
    _id: "order-1",
    items: [
      {
        productId: testProduct._id,
        title: testProduct.title,
        image: testProduct.image,
        unitPrice: 80.99,
        quantity: 1,
      },
    ],
    amount: { currency: "USD", value: "80.99" },
    status: "COMPLETED",
    createdAt: "2026-01-02T10:00:00.000Z",
  },
];

export async function mockProductsApi(
  page: Page,
  products: Product[] = [testProduct],
): Promise<void> {
  await page.route(/^https:\/\/resize\.cdn\.otakumode\.com\//, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      headers: { "Cache-Control": "public, max-age=3600" },
      body: "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='600'><rect width='500' height='600' fill='#a5b4fc'/></svg>",
    });
  });

  await page.route(/\/products\/product\/([^/?]+)$/, async (route) => {
    const id = new URL(route.request().url()).pathname.split("/").pop();
    const product = products.find((item) => item._id === id);

    if (!product) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Product not found" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(product),
    });
  });

  await page.route(/\/products\/random(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(products.slice(0, 6)),
    });
  });

  await page.route(/\/products\/\d+(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildProductsResponse(products)),
    });
  });
}

export async function mockLoggedInAccount(page: Page): Promise<void> {
  await page.addInitScript(
    ({ user }) => {
      localStorage.setItem("accessToken", "test-access-token");
      localStorage.setItem("refreshToken", "test-refresh-token");
      localStorage.setItem("user", JSON.stringify(user));
    },
    { user: adminUser },
  );

  await page.route(/\/profile$/, async (route) => {
    if (route.request().method() === "PUT") {
      const update = route.request().postDataJSON() as Partial<Profile>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...profileFixture, ...update }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(profileFixture),
    });
  });

  await page.route(/\/orders$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ordersFixture),
    });
  });
}

export async function seedCart(page: Page): Promise<void> {
  await page.addInitScript(
    ({ product }) => {
      localStorage.setItem(
        "cart",
        JSON.stringify([
          {
            ...product,
            qty: 2,
          },
        ]),
      );
    },
    { product: testProduct },
  );
}

export async function expectPageHeading(page: Page, name: string | RegExp): Promise<void> {
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
}

export async function expectProductVisible(page: Page): Promise<void> {
  await expect(page.getByText(testProduct.title).first()).toBeVisible();
}
