export function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  max: number,
): number | null {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value)) return null;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    return null;
  }

  return parsed;
}
