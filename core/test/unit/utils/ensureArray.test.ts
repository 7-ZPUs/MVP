import { describe, it, expect } from "vitest";
import { ensureArray } from "../../../src/repo/impl/utils/ensureArray";

describe("ensureArray", () => {
  // identifier: TU-F-B-106
  // method_name: should()
  // description: should return an empty array for undefined
  // expected_value: returns an empty array for undefined
  it("should return an empty array for undefined", () => {
    expect(ensureArray(undefined)).toEqual([]);
  });

  // identifier: TU-F-B-107
  // method_name: should()
  // description: should return an empty array for null
  // expected_value: returns an empty array for null
  it("should return an empty array for null", () => {
    // @ts-expect-error - testing invalid input
    expect(ensureArray(null)).toEqual([]);
  });

  // identifier: TU-F-B-108
  // method_name: should()
  // description: should return the same array if an array is passed
  // expected_value: returns the same array if an array is passed
  it("should return the same array if an array is passed", () => {
    const input = [1, 2, 3];
    expect(ensureArray(input)).toBe(input);
  });

  // identifier: TU-F-B-109
  // method_name: should()
  // description: should wrap a single non-array value in an array
  // expected_value: matches asserted behavior: wrap a single non-array value in an array
  it("should wrap a single non-array value in an array", () => {
    expect(ensureArray(1)).toEqual([1]);
    expect(ensureArray("test")).toEqual(["test"]);
    expect(ensureArray({ a: 1 })).toEqual([{ a: 1 }]);
  });
});
