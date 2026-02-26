import { currentPartitionKeyFromCuts, isValidCuts } from "./splitMath";

export type CutPoint = {
  cutA: number;
  cutB: number;
  x: number;
  y: number;
  key: string;
  id: string;
};

export function orderedCutPoints(n: number): CutPoint[] {
  if (!Number.isInteger(n) || n < 3) {
    return [];
  }

  const points: CutPoint[] = [];
  for (let cutA = 1; cutA <= n - 2; cutA += 1) {
    const span = n - cutA - 1;
    for (let cutB = cutA + 1; cutB <= n - 1; cutB += 1) {
      const col = cutB - cutA - 1;
      points.push({
        cutA,
        cutB,
        x: span <= 1 ? 0 : col / (span - 1),
        y: (cutA - 1) / Math.max(1, n - 3),
        key: currentPartitionKeyFromCuts(cutA, cutB, n),
        id: `${cutA}|${cutB}`,
      });
    }
  }
  return points;
}

export function orderedCutPoint(cutA: number, cutB: number, n: number): CutPoint | null {
  if (!isValidCuts(cutA, cutB, n)) {
    return null;
  }
  const span = n - cutA - 1;
  const col = cutB - cutA - 1;
  return {
    cutA,
    cutB,
    x: span <= 1 ? 0 : col / (span - 1),
    y: (cutA - 1) / Math.max(1, n - 3),
    key: currentPartitionKeyFromCuts(cutA, cutB, n),
    id: `${cutA}|${cutB}`,
  };
}

