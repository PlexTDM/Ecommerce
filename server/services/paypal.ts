import { getEnv } from "../env.ts";

export interface PayPalErrorDetail {
  issue?: string;
  description?: string;
  [key: string]: unknown;
}

export interface PayPalCapture {
  id?: string;
  status?: string;
  amount?: {
    currency_code?: string;
    value?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PayPalPayments {
  captures?: PayPalCapture[];
  [key: string]: unknown;
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  payments?: PayPalPayments;
  [key: string]: unknown;
}

export interface PayPalResponseData {
  id?: string;
  status?: string;
  details?: PayPalErrorDetail[];
  purchase_units?: PayPalPurchaseUnit[];
  [key: string]: unknown;
}

export interface PayPalResult {
  data: PayPalResponseData;
  statusCode: number;
}

export interface CreatePayPalOrderInput {
  value: string;
  requestId: string;
  customId?: string;
}

export interface CapturePayPalOrderInput {
  orderId: string;
  requestId: string;
  value?: string;
}

export class PayPalApiError extends Error {
  readonly statusCode: number;
  readonly details: PayPalResponseData;

  constructor(message: string, statusCode: number, details: PayPalResponseData) {
    super(message);
    this.name = "PayPalApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(response: Response): Promise<PayPalResponseData> {
  const value: unknown = await response.json().catch(() => ({}));
  return isRecord(value) ? value : {};
}

async function getAccessToken(): Promise<string> {
  const env = getEnv();

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString(
    "base64",
  );

  const response = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new PayPalApiError("Failed to obtain PayPal access token", response.status, data);
  }

  const accessToken = data.access_token;
  const expiresIn = data.expires_in;

  if (typeof accessToken !== "string") {
    throw new PayPalApiError("PayPal access token response was invalid", response.status, data);
  }

  cachedToken = {
    token: accessToken,
    expiresAt:
      Date.now() + (typeof expiresIn === "number" && expiresIn > 0 ? expiresIn : 3600) * 1000,
  };

  return accessToken;
}

export async function createPayPalOrder(input: CreatePayPalOrderInput): Promise<PayPalResult> {
  const env = getEnv();

  if (env.PAYPAL_MOCK) {
    return {
      data: {
        id: `MOCK-${input.requestId}`,
        status: "CREATED",
      },
      statusCode: 201,
    };
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": input.requestId,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: input.value,
          },
          ...(input.customId ? { custom_id: input.customId } : {}),
        },
      ],
    }),
  });

  return { data: await readJson(response), statusCode: response.status };
}

export async function capturePayPalOrder(input: CapturePayPalOrderInput): Promise<PayPalResult> {
  const env = getEnv();

  if (env.PAYPAL_MOCK) {
    return {
      data: {
        id: input.orderId,
        status: "COMPLETED",
        purchase_units: [
          {
            reference_id: "default",
            payments: {
              captures: [
                {
                  id: `MOCK-CAPTURE-${input.requestId}`,
                  status: "COMPLETED",
                  amount: {
                    currency_code: "USD",
                    value: input.value ?? "0.00",
                  },
                },
              ],
            },
          },
        ],
      },
      statusCode: 200,
    };
  }

  const accessToken = await getAccessToken();
  const response = await fetch(
    `${env.PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(input.orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": input.requestId,
      },
      body: JSON.stringify({}),
    },
  );

  return { data: await readJson(response), statusCode: response.status };
}

export function resetPayPalTokenCacheForTests(): void {
  cachedToken = null;
}
