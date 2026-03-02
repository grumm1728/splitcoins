import { describe, expect, it } from "vitest";
import { nextCutsForHandle } from "./coinRow";

describe("coin row helpers", () => {
  it("clamps the first handle against the latest second cut", () => {
    const afterPreview = nextCutsForHandle("a", 8, {
      n: 12,
      cutA: 3,
      cutB: 6,
    });

    expect(afterPreview).toEqual({ cutA: 5, cutB: 6 });
  });

  it("clamps the second handle against the latest first cut", () => {
    const afterDrag = nextCutsForHandle("b", 2, {
      n: 12,
      cutA: 4,
      cutB: 9,
    });

    expect(afterDrag).toEqual({ cutA: 4, cutB: 5 });
  });
});
