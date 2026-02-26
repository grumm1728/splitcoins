import type { Mode } from "../state/gameState";

type ShareableState = {
  n: number;
  mode: Mode;
  cutA: number;
  cutB: number;
  discovered: ReadonlySet<string>;
};

export function buildShareUrl(state: ShareableState): string {
  const url = new URL(window.location.href);
  return buildShareUrlFromBase(url.toString(), state);
}

export function buildShareUrlFromBase(baseUrl: string, state: ShareableState): string {
  const url = new URL(baseUrl);
  const params = url.searchParams;
  params.set("n", String(state.n));
  params.set("mode", state.mode);
  params.set("c1", String(state.cutA));
  params.set("c2", String(state.cutB));

  const encodedDiscovered = encodeDiscovered(state.discovered);
  if (encodedDiscovered.length > 0) {
    params.set("d", encodedDiscovered);
  } else {
    params.delete("d");
  }

  url.search = params.toString();
  return url.toString();
}

export function parseShareState(): Partial<{
  n: number;
  mode: Mode;
  cutA: number;
  cutB: number;
  discovered: Set<string>;
}> {
  return parseShareStateFromSearch(window.location.search);
}

export function parseShareStateFromSearch(search: string): Partial<{
  n: number;
  mode: Mode;
  cutA: number;
  cutB: number;
  discovered: Set<string>;
}> {
  const params = new URLSearchParams(search);
  const n = Number(params.get("n"));
  const modeRaw = params.get("mode");
  const cutA = Number(params.get("c1"));
  const cutB = Number(params.get("c2"));
  const discoveredRaw = params.get("d");

  const parsed: Partial<{
    n: number;
    mode: Mode;
    cutA: number;
    cutB: number;
    discovered: Set<string>;
  }> = {};

  if (Number.isInteger(n)) {
    parsed.n = n;
  }
  if (modeRaw === "explore" || modeRaw === "challenge") {
    parsed.mode = modeRaw;
  }
  if (Number.isInteger(cutA)) {
    parsed.cutA = cutA;
  }
  if (Number.isInteger(cutB)) {
    parsed.cutB = cutB;
  }
  if (discoveredRaw) {
    parsed.discovered = decodeDiscovered(discoveredRaw);
  }

  return parsed;
}

function encodeDiscovered(keys: ReadonlySet<string>): string {
  const sorted = [...keys].sort();
  const joined = sorted.join(".");
  if (joined.length > 1200) {
    return "";
  }
  return joined;
}

function decodeDiscovered(value: string): Set<string> {
  if (value.length > 2000) {
    return new Set<string>();
  }
  const entries = value
    .split(".")
    .map((entry) => entry.trim())
    .filter((entry) => /^\d+\+\d+\+\d+$/.test(entry));
  return new Set(entries);
}
