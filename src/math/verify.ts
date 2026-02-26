import { countByFormula } from "./formulas";
import { countByEnumeration } from "./partitions";

export type ReferenceRow = {
  n: number;
  oneCount: number;
  twoCount: number;
  threeCount: number;
};

export function buildReferenceTable(maxN: number): ReferenceRow[] {
  const rows: ReferenceRow[] = [];
  for (let n = 1; n <= maxN; n += 1) {
    rows.push({
      n,
      oneCount: countByEnumeration(n, 1),
      twoCount: countByEnumeration(n, 2),
      threeCount: countByEnumeration(n, 3),
    });
  }
  return rows;
}

export function formulaMatchesEnumeration(n: number, k: 1 | 2 | 3): boolean {
  return countByFormula(n, k) === countByEnumeration(n, k);
}

