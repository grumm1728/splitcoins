import { describe, expect, it } from "vitest";
import {
  countByFormula,
  currentPartitionKeyFromCuts,
  multiplicity,
  normalizeUnordered,
  orderedCutsToParts,
  representativeCutForPartition,
} from "./splitMath";
import { partitionPoints } from "./partitionSpace";

describe("split math boundaries", () => {
  it("converts cuts to parts", () => {
    expect(orderedCutsToParts(2, 5, 9)).toEqual([2, 3, 4]);
  });

  it("normalizes unordered parts", () => {
    expect(normalizeUnordered([4, 1, 3])).toEqual([1, 3, 4]);
  });

  it("maps cuts to partition key", () => {
    expect(currentPartitionKeyFromCuts(2, 5, 9)).toBe("2+3+4");
  });
});

describe("multiplicity classification", () => {
  it("returns 1 for all equal", () => {
    expect(multiplicity([4, 4, 4])).toBe(1);
  });

  it("returns 3 for two equal", () => {
    expect(multiplicity([2, 2, 5])).toBe(3);
  });

  it("returns 6 for all distinct", () => {
    expect(multiplicity([1, 3, 8])).toBe(6);
  });
});

describe("partition-space consistency", () => {
  it("matches round(n^2/12) for n=3..60", () => {
    for (let n = 3; n <= 60; n += 1) {
      expect(partitionPoints(n).length).toBe(countByFormula(n, 3));
    }
  });

  it("finds representative cuts for partition keys", () => {
    const key = "2+3+4";
    const cut = representativeCutForPartition(9, key);
    expect(cut).toEqual({ cutA: 2, cutB: 5 });
    expect(currentPartitionKeyFromCuts(cut.cutA, cut.cutB, 9)).toBe(key);
  });
});

