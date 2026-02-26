export type Partition = number[];

export function enumeratePartitions(n: number, k: number): Partition[] {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 1 || k < 1 || k > n) {
    return [];
  }

  const results: Partition[] = [];
  backtrack(n, k, 1, [], results);
  return results;
}

export function countByEnumeration(n: number, k: number): number {
  return enumeratePartitions(n, k).length;
}

export function isValidPartition(parts: Partition, n: number, k: number): boolean {
  if (!Array.isArray(parts)) {
    return false;
  }
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 1 || k < 1) {
    return false;
  }
  if (parts.length !== k) {
    return false;
  }
  if (parts.some((value) => !Number.isInteger(value) || value < 1)) {
    return false;
  }
  return parts.reduce((sum, value) => sum + value, 0) === n;
}

export function partitionKey(parts: Partition): string {
  return [...parts].sort((a, b) => a - b).join("+");
}

function backtrack(
  remaining: number,
  partsLeft: number,
  minPart: number,
  current: number[],
  results: Partition[],
): void {
  if (partsLeft === 1) {
    if (remaining >= minPart) {
      results.push([...current, remaining]);
    }
    return;
  }

  const maxPart = Math.floor(remaining / partsLeft);
  for (let nextPart = minPart; nextPart <= maxPart; nextPart += 1) {
    current.push(nextPart);
    backtrack(remaining - nextPart, partsLeft - 1, nextPart, current, results);
    current.pop();
  }
}

