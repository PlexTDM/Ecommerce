import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  PayPalButtons,
  PayPalScriptProvider,
  type PayPalButtonsComponentProps,
  type ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js";
import toast from "react-hot-toast";
import { capturePaymentOrder, createPaymentOrder, getApiErrorMessage } from "../api";
import { CLEAR_CART } from "../redux/action";
import type { CartItem, PaymentCartLine, ShippingInput } from "../types";

type CreateOrderHandler = NonNullable<PayPalButtonsComponentProps["createOrder"]>;
type OnApproveHandler = NonNullable<PayPalButtonsComponentProps["onApprove"]>;
type OnErrorHandler = NonNullable<PayPalButtonsComponentProps["onError"]>;

export interface PaypalProps {
  cart: CartItem[];
  shipping?: ShippingInput;
  disabled?: boolean;
}

const toPaymentCart = (cart: CartItem[]): PaymentCartLine[] =>
  cart.map((item) => ({ id: item._id, quantity: item.qty }));

const paypalOptions: ReactPayPalScriptOptions = {
  clientId: String(import.meta.env.VITE_PAYPAL_CLIENT_ID ?? ""),
  currency: "USD",
  intent: "capture",
};

const Paypal = ({ cart, shipping, disabled = false }: PaypalProps) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  // One key per checkout attempt. SDK retries of createOrder reuse it.
  const createKeyRef = useRef<string | null>(null);

  const getCreateKey = (): string => {
    if (!createKeyRef.current) {
      createKeyRef.current = crypto.randomUUID();
    }

    return createKeyRef.current;
  };

  const handleCreateOrder: CreateOrderHandler = async () => {
    setMessage("");

    try {
      const idempotencyKey = getCreateKey();
      const orderData = await createPaymentOrder(
        { cart: toPaymentCart(cart), shipping },
        idempotencyKey,
      );

      if (orderData.id) {
        return orderData.id;
      }

      const detail = orderData.details?.[0];
      const detailMessage = detail
        ? `${detail.issue ?? "PayPal error"}: ${detail.description ?? "Order could not be created"}`
        : (orderData.message ?? orderData.error ?? "PayPal did not return an order id.");

      throw new Error(
        orderData.debug_id ? `${detailMessage} (${orderData.debug_id})` : detailMessage,
      );
    } catch (error) {
      const text = getApiErrorMessage(error, "Could not start PayPal checkout. Please try again.");
      // The server stored this key with a failure response. Rotate it so the
      // next attempt is a fresh PayPal request instead of a replayed failure.
      createKeyRef.current = null;
      setMessage(text);
      toast.error(text);
      throw error;
    }
  };

  const handleApprove: OnApproveHandler = async (data, actions) => {
    try {
      const captureKey = `capture:${data.orderID}`;
      const orderData = await capturePaymentOrder(data.orderID, captureKey);
      const detail = orderData.details?.[0];

      if (detail?.issue === "INSTRUMENT_DECLINED") {
        const text = "Your payment instrument was declined. Please choose another payment method.";
        setMessage(text);
        toast.error(text);
        actions.restart();
        return;
      }

      if (detail) {
        throw new Error(
          `${detail.issue ?? "Payment error"}: ${detail.description ?? "Payment could not be completed"}${
            orderData.debug_id ? ` (${orderData.debug_id})` : ""
          }`,
        );
      }

      const capture = orderData.purchase_units?.[0]?.payments?.captures?.[0];
      const status = capture?.status ?? orderData.status ?? "UNKNOWN";
      const text = capture?.id
        ? `Payment ${status}. Capture ID: ${capture.id}`
        : `Payment ${status}.`;

      setMessage(text);
      createKeyRef.current = null;

      if (status === "COMPLETED") {
        toast.success(text);
        dispatch(CLEAR_CART());
      } else {
        // PENDING (or an unknown state) means the funds are not settled yet;
        // keep the cart so the shopper can retry.
        toast(text);
      }
    } catch (error) {
      const text = getApiErrorMessage(error, "Sorry, your transaction could not be processed.");
      setMessage(text);
      toast.error(text);
    }
  };

  const handleError: OnErrorHandler = (error) => {
    const text = getApiErrorMessage(error, "PayPal encountered an error. Please try again.");
    createKeyRef.current = null;
    setMessage(text);
    toast.error(text);
  };

  if (!paypalOptions.clientId) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        PayPal is not configured. Set <code>VITE_PAYPAL_CLIENT_ID</code> to enable checkout.
      </p>
    );
  }

  return (
    <div>
      <PayPalScriptProvider options={paypalOptions}>
        <PayPalButtons
          style={{ shape: "rect", layout: "vertical" }}
          disabled={disabled || cart.length === 0}
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
          onError={handleError}
        />
      </PayPalScriptProvider>

      {message && (
        <p role="status" className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {message}
        </p>
      )}
    </div>
  );
};

export default Paypal;
