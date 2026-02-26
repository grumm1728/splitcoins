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
      throw new RangeError(`Unsupported k: ${k}`);
  }
}

