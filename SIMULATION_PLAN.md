# Simulation/Game Plan for SplitCoins

## 1) Exact model to implement

State:
- `N`: total coins (positive integer)
- `k`: target number of piles (`1`, `2`, or `3`)
- `partition`: multiset of positive integers summing to `N` (sorted nondecreasing)

Rules:
- Piles must be non-empty.
- Order does not matter (`[1,4,5]` equals `[5,1,4]`).
- Valid split into `k` piles is a partition of `N` into exactly `k` positive parts.

Math checks:
- `count(N,1) = 1`
- `count(N,2) = floor(N/2)`
- `count(N,3) = round(N^2/12)`

## 2) Product shape

Build a small web app with two modes:

1. Explorer (recommended first)
- Slider/input for `N` (e.g. `1..100`)
- Toggle `k` (`1`, `2`, `3`)
- Enumerate all valid partitions
- Show count and compare against formula

2. Challenge game
- App picks `(N,k)` level
- Player lists all unique splits before submitting
- Score based on correctness + speed
- Optional hint: "smallest missing partition pattern"

## 3) Engine design

Files:
- `src/math/partitions.ts`
- `src/math/formulas.ts`
- `src/math/verify.ts`

Core functions:
- `enumeratePartitions(N, k): number[][]`
- `countByEnumeration(N, k): number`
- `countByFormula(N, k): number`
- `isValidPartition(parts, N, k): boolean`

Implementation detail:
- Use backtracking with nondecreasing part constraint to avoid permutation duplicates.

## 4) UI design

Main panels:
- Inputs panel: `N`, `k`, mode switch
- Results panel: total count, formula value, pass/fail indicator
- Partition list panel: rendered as `a + b + c`
- Table panel: precompute rows for `N=1..15` to match prompt

Game-specific UI:
- Entry chips or text parser (`1+3+6`)
- Submitted answers list
- Missing/extra feedback at submit

## 5) Validation and test plan

Unit tests:
- `N=1..15` must reproduce prompt table
- Formula equality checks for `k=2,3` across a larger range (e.g. `N<=500`)
- Partition uniqueness (no duplicates from reordering)

Property checks:
- Every partition sums to `N`
- Every partition has length `k`
- Every part is `>=1`

## 6) Milestones

M1 (engine + tests):
- Implement partition generator and formulas
- Add tests for prompt table and range checks

M2 (explorer UI):
- Build interactive controls and live table
- Add formula-vs-enumeration visual check

M3 (challenge mode):
- Add level generator and score
- Add hint and replay

M4 (proof support):
- Add explanation cards for why formulas hold
- Include cases by `N mod 6` for `round(N^2/12)` intuition

## 7) Suggested immediate tasks

1. Scaffold TypeScript web app (Vite).
2. Implement `enumeratePartitions` and tests first.
3. Build the `N=1..15` table view and verify it matches `PROBLEM.md`.
4. Add challenge mode after correctness is locked.

