import { describe, expect, it } from "vitest";
import { createInitialState, currentKey, setCuts, setN } from "./gameState";

describe("game state discovery rules", () => {
  it("counts discovery from grid and row interactions", () => {
    let state = createInitialState(9);
    const afterGrid = setCuts(state, 2, 5, "grid", 1000);
    state = afterGrid.state;
    expect(afterGrid.newlyDiscovered).toBe(true);
    expect(state.discovered.size).toBe(1);

    const afterRowDuplicate = setCuts(state, 2, 5, "row", 1001);
    expect(afterRowDuplicate.newlyDiscovered).toBe(false);
    expect(afterRowDuplicate.state.discovered.size).toBe(1);
  });

  it("completion triggers only when found equals total", () => {
    let state = createInitialState(3);
    expect(state.total).toBe(1);
    const result = setCuts(state, 1, 2, "row", 1234);
    state = result.state;
    expect(result.completedNow).toBe(true);
    expect(state.completedAtMs).toBe(1234);
  });

  it("updates current key and resets when n changes", () => {
    let state = createInitialState(9);
    state = setCuts(state, 2, 5, "row", 1).state;
    expect(currentKey(state)).toBe("2+3+4");
    expect(state.discovered.size).toBe(1);
    state = setN(state, 15);
    expect(state.discovered.size).toBe(0);
  });
});

