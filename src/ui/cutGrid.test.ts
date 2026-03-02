import { describe, expect, it } from "vitest";
import { buildCutGridRows } from "./cutGrid";

describe("cut grid view models", () => {
  it("builds a triangular set of rows", () => {
    const rows = buildCutGridRows({
      n: 6,
      demoCutA: 1,
      demoCutB: 2,
      revealedCells: new Set<string>(),
      highlightedPermutationKey: null,
    });

    expect(rows.map((row) => row.cells.length)).toEqual([4, 3, 2, 1]);
  });

  it("maps cuts to reveal and permutation-highlight state", () => {
    const rows = buildCutGridRows({
      n: 9,
      demoCutA: 2,
      demoCutB: 5,
      revealedCells: new Set<string>(["3|7"]),
      highlightedPermutationKey: "2+3+4",
    });

    const target = rows[2].cells[3];
    const highlighted = rows[1].cells[2];

    expect(target.parts).toEqual([3, 4, 2]);
    expect(target.revealed).toBe(true);
    expect(highlighted.permutationHighlighted).toBe(true);
    expect(highlighted.unorderedKey).toBe("2+3+4");
  });
});
