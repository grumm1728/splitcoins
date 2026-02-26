import { describe, expect, it } from "vitest";
import { orderedCutPoints } from "./cutGrid";

describe("ordered cut grid", () => {
  it("enumerates all valid ordered cuts", () => {
    const n = 10;
    const points = orderedCutPoints(n);
    const expected = ((n - 1) * (n - 2)) / 2;
    expect(points.length).toBe(expected);
  });

  it("maps to partition keys", () => {
    const points = orderedCutPoints(7);
    const sample = points.find((point) => point.cutA === 2 && point.cutB === 5);
    expect(sample?.key).toBe("2+2+3");
  });
});

