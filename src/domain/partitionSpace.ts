import { enumeratePartitions } from "../math/partitions";
import { multiplicity, type Parts3 } from "./splitMath";

export type PartitionPoint = {
  key: string;
  parts: Parts3;
  x: number;
  y: number;
  multiplicity: 1 | 3 | 6;
  discovered: boolean;
};

export function partitionPoints(n: number, discovered: ReadonlySet<string> = new Set()): PartitionPoint[] {
  if (!Number.isInteger(n) || n < 3) {
    return [];
  }

  const points = enumeratePartitions(n, 3).map((parts) => {
    const [a, b, c] = parts as Parts3;
    const key = `${a}+${b}+${c}`;
    const [x, y] = ternaryToCartesian(a, b, c, n);
    return {
      key,
      parts: [a, b, c],
      x,
      y,
      multiplicity: multiplicity([a, b, c]),
      discovered: discovered.has(key),
    } satisfies PartitionPoint;
  });

  return points.sort((left, right) => {
    if (left.y !== right.y) {
      return right.y - left.y;
    }
    return left.x - right.x;
  });
}

function ternaryToCartesian(a: number, b: number, c: number, n: number): [number, number] {
  const ax = 0;
  const ay = 0;
  const bx = 1;
  const by = 0;
  const cx = 0.5;
  const cy = Math.sqrt(3) / 2;

  const x = ((a * ax) + (b * bx) + (c * cx)) / n;
  const y = ((a * ay) + (b * by) + (c * cy)) / n;
  return [x, y];
}

