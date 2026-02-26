import {
  clampN,
  countByFormula,
  currentPartitionKeyFromCuts,
  defaultCutsForN,
  isValidCuts,
} from "../domain/splitMath";

export type Source = "row" | "grid" | "triangle";

export type GameState = {
  n: number;
  cutA: number;
  cutB: number;
  discovered: Set<string>;
  total: number;
  lastSource: Source;
  completedAtMs: number | null;
};

export type DiscoverResult = {
  state: GameState;
  newlyDiscovered: boolean;
  completedNow: boolean;
  partitionKey: string | null;
};

export function createInitialState(n = 15): GameState {
  const normalizedN = clampN(n);
  const cuts = defaultCutsForN(normalizedN);
  return {
    n: normalizedN,
    cutA: cuts.cutA,
    cutB: cuts.cutB,
    discovered: new Set<string>(),
    total: normalizedN < 3 ? 0 : countByFormula(normalizedN, 3),
    lastSource: "row",
    completedAtMs: null,
  };
}

export function setN(state: GameState, n: number): GameState {
  const normalizedN = clampN(n);
  const cuts = defaultCutsForN(normalizedN);
  return {
    ...state,
    n: normalizedN,
    cutA: cuts.cutA,
    cutB: cuts.cutB,
    discovered: new Set<string>(),
    total: normalizedN < 3 ? 0 : countByFormula(normalizedN, 3),
    completedAtMs: null,
  };
}

export function resetDiscovered(state: GameState): GameState {
  return {
    ...state,
    discovered: new Set<string>(),
    completedAtMs: null,
  };
}

export function setCuts(
  state: GameState,
  cutA: number,
  cutB: number,
  source: Source,
  nowMs: number,
): DiscoverResult {
  if (!isValidCuts(cutA, cutB, state.n)) {
    return { state, newlyDiscovered: false, completedNow: false, partitionKey: null };
  }

  const next: GameState = {
    ...state,
    cutA,
    cutB,
    lastSource: source,
  };

  return attemptDiscover(next, nowMs);
}

export function attemptDiscover(state: GameState, nowMs: number): DiscoverResult {
  if (!isValidCuts(state.cutA, state.cutB, state.n)) {
    return { state, newlyDiscovered: false, completedNow: false, partitionKey: null };
  }

  const key = currentPartitionKeyFromCuts(state.cutA, state.cutB, state.n);
  if (state.discovered.has(key)) {
    return { state, newlyDiscovered: false, completedNow: false, partitionKey: key };
  }

  const discovered = new Set(state.discovered);
  discovered.add(key);
  const completedNow = discovered.size === state.total && state.total > 0;

  return {
    state: {
      ...state,
      discovered,
      completedAtMs: completedNow && state.completedAtMs === null ? nowMs : state.completedAtMs,
    },
    newlyDiscovered: true,
    completedNow,
    partitionKey: key,
  };
}

export function currentKey(state: GameState): string | null {
  if (!isValidCuts(state.cutA, state.cutB, state.n)) {
    return null;
  }
  return currentPartitionKeyFromCuts(state.cutA, state.cutB, state.n);
}
