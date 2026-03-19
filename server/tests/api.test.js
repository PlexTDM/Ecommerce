import { expect, test, describe, mock, beforeAll } from "bun:test";
import path from "path";
import bcryptjs from "bcryptjs";

// Set environment variables for tests
Bun.env.PAYPAL_CLIENT_ID = "test_client_id";
Bun.env.PAYPAL_CLIENT_SECRET = "test_client_secret";
Bun.env.SECRET_ACCESS_TOKEN = "test_access_token";
Bun.env.SECRET_REFRESH_TOKEN = "test_refresh_token";
Bun.env.CORS_ALLOWED_ORIGINS = "http://localhost:3000";
Bun.env.NODE_ENV = "test";

// 1. SET UP ALL MOCKS BEFORE ANY IMPORTS
const productModelPath = import.meta.resolve("../models/product.js");
const userModelPath = import.meta.resolve("../models/user.js");
const profileModelPath = import.meta.resolve("../models/profile.js");
const refreshTokenModelPath = import.meta.resolve("../models/refreshToken.js");

const mockMongoose = {
    connect: async () => ({}),
    Schema: class {
        constructor() { return {}; }
        static Types = { ObjectId: String };
    },
    model: (name) => {
        const createChain = (data) => {
            const chain = {
                session: () => chain,
                sort: () => chain,
                skip: () => chain,
                limit: () => chain,
                then: (cb) => (cb ? Promise.resolve(data).then(cb) : Promise.resolve(data)),
                catch: () => chain,
            };
            return chain;
        };

        return {
            aggregate: async () => [{ title: "Random Product", _id: "1" }],
            findById: async (id) => (id === "1" ? { title: "Product 1", _id: "1", password: bcryptjs.hashSync("password123", 10) } : null),
            find: () => createChain([{ title: "Product List", _id: "2" }]),
            findOne: (q) => {
                let user = null;
                if (q && q.email === "test@example.com") {
                    user = { email: "test@example.com", password: bcryptjs.hashSync("password123", 10), id: "123", _id: "123", role: "USER" };
                }
                return createChain(user);
            },
            create: async (d) => {
                const items = Array.isArray(d) ? d : [d];
                return items.map((item, i) => ({ ...item, _id: `id_${i}`, id: `id_${i}`, role: "USER" }));
            },
            findByIdAndUpdate: async () => ({}),
            findOneAndDelete: async () => ({}),
            deleteMany: async () => ({}),
            countDocuments: async () => 1
        };
    },
    startSession: async () => ({
        startTransaction: () => { },
        commitTransaction: () => { },
        abortTransaction: () => { },
        endSession: () => { }
    })
};
mockMongoose.default = mockMongoose;
mock.module("mongoose", () => mockMongoose);

// Mock models individually
const genericModel = mockMongoose.model("Generic");
mock.module(productModelPath, () => ({ default: genericModel }));
mock.module(userModelPath, () => ({ default: genericModel }));
mock.module(profileModelPath, () => ({ default: genericModel }));
mock.module(refreshTokenModelPath, () => ({ default: genericModel }));

// Mock Bun built-ins
mock.module("bun", () => ({
    redis: { get: async () => null, set: async () => "OK" },
    RedisClient: class { set = async () => "OK"; get = async () => null; }
}));

mock.module("axios", () => ({
    default: {
        post: async (url) => (url.includes("oauth2/token") ? { data: { access_token: "t" } } : { data: { id: "O1" }, status: 201 })
    }
}));

let appInstance;

describe("Ecommerce API Integration Tests", () => {
    beforeAll(async () => {
        const { app } = await import("../server.ts");
        appInstance = app;
    });

    test("GET / - Root", async () => {
        const res = await appInstance.request("/");
        expect(res.status).toBe(200);
    });

    describe("Authentication", () => {
        test("GET /auth/ping - Diagnostics", async () => {
            const res = await appInstance.request("/auth/ping");
            expect(res.status).toBe(200);
            expect(await res.text()).toBe("pong");
        });

        test("POST /auth/login - Success", async () => {
            const res = await appInstance.request("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: "test@example.com", password: "password123" }),
                headers: { "Content-Type": "application/json" }
            });
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.message).toBe("User Logged in successfully");
            expect(body.accessToken).toBeDefined();
        });

        test("POST /auth/register - Success", async () => {
            const res = await appInstance.request("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    name: "Test User",
                    email: "test2@example.com",
                    password: "password123",
                    confirmPassword: "password123"
                }),
                headers: { "Content-Type": "application/json" }
            });
            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.message).toBe("User registered successfully");
        });
    });

    describe("Products", () => {
        test("GET /products/random", async () => {
            const res = await appInstance.request("/products/random");
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body[0].title).toBe("Random Product");
        });

        test("GET /products/1 - Pagination", async () => {
            const res = await appInstance.request("/products/1");
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.products[0].title).toBe("Product List");
        });

        test("GET /products/product/1 - Detail", async () => {
            const res = await appInstance.request("/products/product/1");
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.title).toBe("Product 1");
        });
    });

    describe("Payment", () => {
        test("POST /payment/api/orders - Success", async () => {
            const res = await appInstance.request("/payment/api/orders", {
                method: "POST",
                body: JSON.stringify({ cart: [] }),
                headers: { "Content-Type": "application/json" }
            });
            expect(res.status).toBe(201);
        });
    });
});
