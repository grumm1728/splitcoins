# Problem Statement

Source: James Tanton (@jamestanton)

There is only 1 way to "split" a pile of `N` coins into one pile.

There are `N/2`, rounded down to the nearest integer, ways to split them into 2 non-empty piles (order of piles irrelevant).

Prove there are `(N^2)/12`, rounded to the nearest integer, ways to split into 3 piles.

Reference values shown in the prompt:

- `N = 1..15`
- one pile: `1 1 1 1 1 1 1 1 1 1 1 1 1 1 1`
- two piles: `0 1 1 2 2 3 3 4 4 5 5 6 6 7 7`
- three piles: `0 0 1 1 2 3 4 5 7 8 10 12 14 16 19`

