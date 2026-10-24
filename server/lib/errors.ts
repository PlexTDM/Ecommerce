export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isDuplicateKeyError(error: unknown): boolean {
  return isRecord(error) && error.code === 11000;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
