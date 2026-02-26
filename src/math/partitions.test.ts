import { describe, expect, it } from "vitest";
import { countByFormula } from "./formulas";
import { countByEnumeration, enumeratePartitions, partitionKey } from "./partitions";

describe("SplitCoins prompt table (N = 1..15)", () => {
  const expectedOne = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const expectedTwo = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
  const expectedThree = [0, 0, 1, 1, 2, 3, 4, 5, 7, 8, 10, 12, 14, 16, 19];

  it("matches one-pile counts", () => {
    const actual = range15().map((n) => countByEnumeration(n, 1));
    expect(actual).toEqual(expectedOne);
  });

  it("matches two-pile counts", () => {
    const actual = range15().map((n) => countByEnumeration(n, 2));
    expect(actual).toEqual(expectedTwo);
  });

  it("matches three-pile counts", () => {
    const actual = range15().map((n) => countByEnumeration(n, 3));
    expect(actual).toEqual(expectedThree);
  });
});

describe("Formula checks", () => {
  it("matches enumeration for k=2 up to N=500", () => {
    for (let n = 1; n <= 500; n += 1) {
      expect(countByFormula(n, 2)).toBe(countByEnumeration(n, 2));
    }
  });

  it("matches enumeration for k=3 up to N=120", () => {
    for (let n = 1; n <= 120; n += 1) {
      expect(countByFormula(n, 3)).toBe(countByEnumeration(n, 3));
    }
  });
});

describe("partition uniqueness", () => {
  it("contains no duplicates from reordering", () => {
    const partitions = enumeratePartitions(10, 3);
    const keys = partitions.map(partitionKey);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

function range15(): number[] {
  return Array.from({ length: 15 }, (_, index) => index + 1);
}

