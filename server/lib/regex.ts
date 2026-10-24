const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

export function escapeRegExp(value: string): string {
  return value.replace(REGEX_SPECIAL_CHARACTERS, "\\$&");
}
