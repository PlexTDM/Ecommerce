import axios from 'axios';
import { Hono } from 'hono';
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = Bun.env;

const base = "https://api-m.sandbox.paypal.com";

const app = new Hono();

const generateAccessToken = async () => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }
        const auth = Buffer.from(
            PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
        ).toString("base64");
        const response = await axios.post(`${base}/v1/oauth2/token`, "grant_type=client_credentials", {
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        });

        return response.data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error);
    }
};

const createOrder = async (cart) => {
    console.log(
        "shopping cart information passed from the frontend createOrder() callback:",
        cart,
    );

    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: "0.01",
                },
            },
        ],
    };

    const response = await axios.post(url, payload, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return handleResponse(response);
};

const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

    const response = await axios.post(url, {}, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return handleResponse(response);
};

async function handleResponse(response) {
    try {
        return {
            jsonResponse: response.data,
            httpStatusCode: response.status,
        };
    } catch (err) {
        throw new Error(response.data);
    }
}

app.post("/api/orders", async (c) => {
    try {
        const { cart } = await c.req.parseBody();
        const { jsonResponse, httpStatusCode } = await createOrder(cart);
        return c.json(jsonResponse, httpStatusCode);
    } catch (error) {
        console.error("Failed to create order:", error);
        return c.json({ error: "Failed to create order." }, 500);
    }
});

app.post("/api/orders/:orderID/capture", async (c) => {
    try {
        const { orderID } = c.req.param();
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        return c.json(jsonResponse, httpStatusCode);
    } catch (error) {
        console.error("Failed to capture order:", error);
        return c.json({ error: "Failed to capture order." }, 500);
    }
});

export default app;