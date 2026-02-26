export type Parts3 = [number, number, number];

export function isValidCuts(cutA: number, cutB: number, n: number): boolean {
  return Number.isInteger(cutA)
    && Number.isInteger(cutB)
    && Number.isInteger(n)
    && n >= 3
    && cutA >= 1
    && cutB <= n - 1
    && cutA < cutB;
}

export function orderedCutsToParts(cutA: number, cutB: number, n: number): Parts3 {
  if (!isValidCuts(cutA, cutB, n)) {
    throw new RangeError(`Invalid cuts (${cutA}, ${cutB}) for n=${n}`);
  }
  return [cutA, cutB - cutA, n - cutB];
}

export function normalizeUnordered(parts: Parts3): Parts3 {
  const sorted = [...parts].sort((a, b) => a - b);
  return [sorted[0], sorted[1], sorted[2]];
}

export function partitionKey(parts: number[]): string {
  return [...parts].sort((a, b) => a - b).join("+");
}

export function currentPartitionKeyFromCuts(cutA: number, cutB: number, n: number): string {
  return partitionKey(orderedCutsToParts(cutA, cutB, n));
}

export function multiplicity(partsSorted: Parts3): 1 | 3 | 6 {
  const [a, b, c] = partsSorted;
  if (a === b && b === c) {
    return 1;
  }
  if (a === b || b === c || a === c) {
    return 3;
  }
  return 6;
}

export function representativeCutForPartition(
  n: number,
  key: string,
): { cutA: number; cutB: number } {
  const values = key
    .split("+")
    .map((token) => Number(token))
    .sort((a, b) => a - b);
  if (values.length !== 3 || values.some((value) => !Number.isInteger(value) || value < 1)) {
    throw new RangeError(`Invalid partition key: ${key}`);
  }

  const [a, b, c] = values as Parts3;
  if (a + b + c !== n) {
    throw new RangeError(`Partition key ${key} does not sum to n=${n}`);
  }

  return { cutA: a, cutB: a + b };
}

export function countByFormula(n: number, k: number): number {
  if (!Number.isInteger(n) || n < 1) {
    return 0;
  }
  switch (k) {
    case 1:
      return 1;
    case 2:
      return Math.floor(n / 2);
    case 3:
      return Math.round((n * n) / 12);
    default:
      throw new RangeError(`Unsupported k=${k}`);
  }
}

export function clampN(value: number): number {
  if (!Number.isFinite(value)) {
    return 3;
  }
  return Math.max(1, Math.min(60, Math.round(value)));
}

export function defaultCutsForN(n: number): { cutA: number; cutB: number } {
  if (n < 3) {
    return { cutA: 0, cutB: 0 };
  }
  if (n === 3) {
    return { cutA: 1, cutB: 2 };
  }
  const first = Math.max(1, Math.floor(n / 3));
  const second = Math.max(first + 1, Math.floor((2 * n) / 3));
  return { cutA: first, cutB: Math.min(n - 1, second) };
}

