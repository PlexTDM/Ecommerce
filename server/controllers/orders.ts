import { Hono } from "hono";
import mongoose from "mongoose";
import Order from "../models/order.ts";
import type { AppEnv } from "../types.ts";
import { authenticate } from "./token.ts";

const app = new Hono<AppEnv>();

app.use("*", authenticate);

app.get("/", async (c) => {
  const user = c.get("user");

  try {
    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(user.id),
    })
      .sort({ createdAt: -1 })
      .select("-createResponse -captureResponse");

    return c.json(orders, 200);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

app.get("/:id", async (c) => {
  const { id } = c.req.param();

  if (!mongoose.isValidObjectId(id)) {
    return c.json({ error: "Order not found" }, 404);
  }

  try {
    const order = await Order.findById(id).select("-createResponse -captureResponse");

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    const user = c.get("user");

    if (!order.userId || order.userId.toString() !== user.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    return c.json(order, 200);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return c.json({ error: "Failed to fetch order" }, 500);
  }
});

export default app;
