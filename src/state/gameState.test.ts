import { describe, expect, it } from "vitest";
import {
  createInitialState,
  currentKey,
  setCuts,
  setMode,
  setN,
} from "./gameState";

describe("game state discovery rules", () => {
  it("explore mode counts discoveries from abstract sources", () => {
    const state = setMode(createInitialState(9, "challenge"), "explore");
    const afterGrid = setCuts(state, 2, 5, "grid", 1000);
    expect(afterGrid.newlyDiscovered).toBe(true);
    expect(afterGrid.state.discovered.size).toBe(1);
  });

  it("challenge mode ignores abstract-source discovery", () => {
    const state = createInitialState(9, "challenge");
    const afterGrid = setCuts(state, 2, 5, "grid", 1000);
    expect(afterGrid.newlyDiscovered).toBe(false);
    expect(afterGrid.state.discovered.size).toBe(0);

    const afterRow = setCuts(afterGrid.state, 2, 5, "row", 1001);
    expect(afterRow.newlyDiscovered).toBe(true);
    expect(afterRow.state.discovered.size).toBe(1);
  });

  it("completion triggers only when found equals total", () => {
    let state = createInitialState(3, "challenge");
    expect(state.total).toBe(1);
    const result = setCuts(state, 1, 2, "row", 1234);
    state = result.state;
    expect(result.completedNow).toBe(true);
    expect(state.completedAtMs).toBe(1234);
  });

  it("updates current key and resets when n changes", () => {
    let state = createInitialState(9, "explore");
    state = setCuts(state, 2, 5, "row", 1).state;
    expect(currentKey(state)).toBe("2+3+4");
    expect(state.discovered.size).toBe(1);
    state = setN(state, 15);
    expect(state.discovered.size).toBe(0);
  });
});

