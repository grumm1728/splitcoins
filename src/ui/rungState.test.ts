import { describe, expect, it } from "vitest";
import { partitionPoints } from "../domain/partitionSpace";
import {
  nearestOrderedLatticePoint,
  nearestPartitionPoint,
  orderedLatticePoints,
  pointToSvg,
  submitOrderedSplit,
} from "./rungState";

describe("rung state helpers", () => {
  it("groups reordered duplicates onto the first matching row", () => {
    const first = submitOrderedSplit([], [3, 4, 3], 10);
    const second = submitOrderedSplit(first, [3, 3, 4], 11);
    const third = submitOrderedSplit(second, [3, 4, 3], 12);

    expect(third).toHaveLength(1);
    expect(third[0].primaryOrder).toEqual([3, 4, 3]);
    expect(third[0].duplicateOrders).toEqual([
      [3, 3, 4],
      [3, 4, 3],
    ]);
  });

  it("snaps to the nearest valid partition node within the threshold", () => {
    const points = partitionPoints(9);
    const target = points.find((point) => point.key === "2+3+4");
    expect(target).toBeTruthy();
    const targetPosition = pointToSvg(target!);
    const snapped = nearestPartitionPoint(
      points,
      { x: targetPosition.x + 6, y: targetPosition.y - 4 },
      24,
    );
    expect(snapped?.key).toBe(target?.key);
  });

  it("returns null when the drop is too far from any node", () => {
    const points = partitionPoints(9);
    const snapped = nearestPartitionPoint(points, { x: 390, y: 20 }, 12);
    expect(snapped).toBeNull();
  });

  it("finds ordered lattice points and snaps to them", () => {
    const points = orderedLatticePoints(10);
    const target = points.find((point) => point.id === "1|8|1");
    expect(target).toBeTruthy();
    const snapped = nearestOrderedLatticePoint(
      points,
      { x: target!.x + 4, y: target!.y - 3 },
      12,
    );
    expect(snapped?.id).toBe("1|8|1");
  });
});
