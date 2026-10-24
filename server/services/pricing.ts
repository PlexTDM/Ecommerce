export interface PricingLine {
  unitPrice: number;
  quantity: number;
}

export interface OrderAmountResult {
  total: number;
  value: string;
}

export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateUnitPrice(price: number, discount: number | null | undefined): number {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Invalid product price");
  }

  const rawDiscount = typeof discount === "number" && Number.isFinite(discount) ? discount : 0;
  const percent = Math.min(100, Math.max(0, rawDiscount));

  return roundCents(price * (1 - percent / 100));
}

export function calculateOrderAmount(lines: PricingLine[]): OrderAmountResult {
  let totalCents = 0;

  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("Invalid line quantity");
    }
    totalCents += Math.round(line.unitPrice * 100) * line.quantity;
  }

  const total = totalCents / 100;
  return { total, value: total.toFixed(2) };
}
