const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const numberFormatter = new Intl.NumberFormat("en-US");

export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return currencyFormatter.format(0);
  }

  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    const raw = String(value).trim();

    if (!raw) return currencyFormatter.format(0);
    return raw.startsWith("$") ? raw : `$${raw}`;
  }

  return currencyFormatter.format(amount);
};

export const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return numberFormatter.format(value);
};

export const formatDate = (value?: string): string => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (value?: string): string => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
