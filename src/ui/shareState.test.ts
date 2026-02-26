import { describe, expect, it } from "vitest";
import { buildShareUrlFromBase, parseShareStateFromSearch } from "./shareState";

describe("share state url encoding", () => {
  it("round-trips core fields and discovered keys", () => {
    const url = buildShareUrlFromBase("https://example.com/splitcoins/", {
      n: 15,
      mode: "challenge",
      cutA: 4,
      cutB: 9,
      discovered: new Set(["1+4+10", "3+5+7"]),
    });
    const parsed = parseShareStateFromSearch(new URL(url).search);
    expect(parsed.n).toBe(15);
    expect(parsed.mode).toBe("challenge");
    expect(parsed.cutA).toBe(4);
    expect(parsed.cutB).toBe(9);
    expect(parsed.discovered?.has("1+4+10")).toBe(true);
    expect(parsed.discovered?.has("3+5+7")).toBe(true);
  });
});

