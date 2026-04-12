import { describe, it, expect } from "vitest";
import { ensureArray } from "../../../../src/repo/impl/utils/ensureArray";

describe("ensureArray", () => {
  // identifier: TU-F-browsing-76
  // method_name: ensureArray()
  // description: should return an empty array for undefined
  // expected_value: returns an empty array for undefined
  it("TU-F-browsing-76: ensureArray() should return an empty array for undefined", () => {
    expect(ensureArray(undefined)).toEqual([]);
  });

  // identifier: TU-F-browsing-77
  // method_name: ensureArray()
  // description: should return an empty array for null
  // expected_value: returns an empty array for null
  it("TU-F-browsing-77: ensureArray() should return an empty array for null", () => {
    expect(ensureArray(null)).toEqual([]);
  });

  // identifier: TU-F-browsing-78
  // method_name: ensureArray()
  // description: should return the same array if an array is passed
  // expected_value: returns the same array if an array is passed
  it("TU-F-browsing-78: ensureArray() should return the same array if an array is passed", () => {
    const input = [1, 2, 3];
    expect(ensureArray(input)).toBe(input);
  });

  // identifier: TU-F-browsing-79
  // method_name: ensureArray()
  // description: should wrap a single non-array value in an array
  // expected_value: matches asserted behavior: wrap a single non-array value in an array
  it("TU-F-browsing-79: ensureArray() should wrap a single non-array value in an array", () => {
    expect(ensureArray(1)).toEqual([1]);
    expect(ensureArray("test")).toEqual(["test"]);
    expect(ensureArray({ a: 1 })).toEqual([{ a: 1 }]);
  });
});
