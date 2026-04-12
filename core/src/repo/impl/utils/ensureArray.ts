/**
 * Ensures a value is always an array.
 * fast-xml-parser may return a single object instead of an array
 * when there's only one element, even with isArray configured.
 */
export function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
