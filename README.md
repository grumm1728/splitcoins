# SplitCoins

Interactive simulation/game for James Tanton's coin-splitting problem.

## Run locally
```bash
npm install
npm run dev
```

## Verification
- Ways to split `N` coins into `1` pile: `1`
- Ways to split `N` coins into `2` non-empty unordered piles: `floor(N/2)`
- Ways to split `N` coins into `3` non-empty unordered piles: `round(N^2/12)`

Run tests and build:
```bash
npm run test
npm run build
```

## App modes
- Explorer: choose `N` and `k` and see all valid unordered partitions.
- Challenge: find all unique splits for a random `(N, k)` level.

## Key files
- `src/math/partitions.ts`: partition enumeration + validation
- `src/math/formulas.ts`: closed-form counting formulas
- `src/math/partitions.test.ts`: prompt-table and formula checks

## GitHub Actions / Pages
- CI workflow: `.github/workflows/ci.yml` runs tests and build on PRs/pushes.
- Pages workflow: `.github/workflows/pages.yml` builds and deploys `dist` to GitHub Pages on pushes to `main`.
- `vite.config.ts` sets base path to `/splitcoins/` in GitHub Actions so assets load correctly for the project page URL.
