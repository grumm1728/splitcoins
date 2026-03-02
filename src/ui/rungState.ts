import type { PartitionPoint } from "../domain/partitionSpace";
import type { Parts3 } from "../domain/splitMath";

export type SubmittedRow = {
  unorderedKey: string;
  primaryOrder: Parts3;
  duplicateOrders: Parts3[];
  firstSubmittedAtMs: number;
};

export type DragPosition = {
  x: number;
  y: number;
};

export type OrderedLatticePoint = {
  id: string;
  parts: Parts3;
  x: number;
  y: number;
};

export function unorderedKeyFromParts(parts: Parts3): string {
  return [...parts].sort((left, right) => left - right).join("+");
}

export function gridCellId(cutA: number, cutB: number): string {
  return `${cutA}|${cutB}`;
}

export function submitOrderedSplit(
  rows: SubmittedRow[],
  parts: Parts3,
  nowMs: number,
): SubmittedRow[] {
  const unorderedKey = unorderedKeyFromParts(parts);
  const rowIndex = rows.findIndex((row) => row.unorderedKey === unorderedKey);

  if (rowIndex === -1) {
    return [
      ...rows,
      {
        unorderedKey,
        primaryOrder: parts,
        duplicateOrders: [],
        firstSubmittedAtMs: nowMs,
      },
    ];
  }

  return rows.map((row, index) => {
    if (index !== rowIndex) {
      return row;
    }
    return {
      ...row,
      duplicateOrders: [...row.duplicateOrders, parts],
    };
  });
}

export function clampToSvgBounds(position: DragPosition): DragPosition {
  return {
    x: Math.max(0, Math.min(400, position.x)),
    y: Math.max(0, Math.min(360, position.y)),
  };
}

export function nearestPartitionPoint(
  points: PartitionPoint[],
  position: DragPosition,
  threshold: number,
): PartitionPoint | null {
  let bestPoint: PartitionPoint | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const point of points) {
    const svgPoint = pointToSvg(point);
    const dx = svgPoint.x - position.x;
    const dy = svgPoint.y - position.y;
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestPoint = point;
    }
  }

  if (bestDistance > threshold) {
    return null;
  }

  return bestPoint;
}

export function pointToSvg(point: Pick<PartitionPoint, "x" | "y">): DragPosition {
  return {
    x: 20 + point.x * 360,
    y: 340 - point.y * 360,
  };
}

export function partsToSvg(parts: Parts3, n: number): DragPosition {
  const x = parts[1] / n + (parts[2] / n) * 0.5;
  const y = (parts[2] / n) * (Math.sqrt(3) / 2);
  return {
    x: 20 + x * 360,
    y: 340 - y * 360,
  };
}

export function orderedLatticePoints(n: number): OrderedLatticePoint[] {
  if (!Number.isInteger(n) || n < 3) {
    return [];
  }

  const points: OrderedLatticePoint[] = [];
  for (let a = 1; a <= n - 2; a += 1) {
    for (let b = 1; b <= n - a - 1; b += 1) {
      const c = n - a - b;
      const parts: Parts3 = [a, b, c];
      const svg = partsToSvg(parts, n);
      points.push({
        id: parts.join("|"),
        parts,
        x: svg.x,
        y: svg.y,
      });
    }
  }
  return points;
}

export function nearestOrderedLatticePoint(
  points: OrderedLatticePoint[],
  position: DragPosition,
  threshold: number,
): OrderedLatticePoint | null {
  let bestPoint: OrderedLatticePoint | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const point of points) {
    const distance = Math.hypot(point.x - position.x, point.y - position.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestPoint = point;
    }
  }

  if (bestDistance > threshold) {
    return null;
  }

  return bestPoint;
}
