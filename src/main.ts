import "./style.css";
import { partitionPoints } from "./domain/partitionSpace";
import { currentPartitionKeyFromCuts, representativeCutForPartition } from "./domain/splitMath";
import {
  createInitialState,
  resetDiscovered,
  setCuts,
  setMode,
  setN,
  type GameState,
  type Source,
} from "./state/gameState";
import { renderCoinRow } from "./ui/coinRow";
import { renderCutGrid } from "./ui/cutGrid";
import { renderHud } from "./ui/hud";
import { buildShareUrl, parseShareState } from "./ui/shareState";
import { renderPartitionTriangle } from "./ui/partitionTriangle";

type Telemetry = {
  startedAtMs: number;
  firstDiscoveryAtMs: number | null;
  completionAtMs: number | null;
  discoveriesBySource: Record<Source, number>;
  triangleClickCount: number;
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = `
  <div class="shell">
    <section id="hud"></section>
    <main class="rungs">
      <section id="coin-row"></section>
      <section id="cut-grid"></section>
      <section id="partition-triangle"></section>
    </main>
    <p id="live-region" class="sr-only" aria-live="polite"></p>
  </div>
`;

const hud = byId("hud");
const coinRow = byId("coin-row");
const cutGrid = byId("cut-grid");
const partitionTriangle = byId("partition-triangle");
const liveRegion = byId("live-region");

const parsed = parseShareState();
let state: GameState = createInitialState(parsed.n ?? 15, parsed.mode ?? "challenge");
if (parsed.cutA !== undefined && parsed.cutB !== undefined) {
  state = setCuts(state, parsed.cutA, parsed.cutB, "row", Date.now()).state;
}
if (parsed.discovered) {
  state = {
    ...state,
    discovered: new Set(parsed.discovered),
  };
}

const telemetry: Telemetry = {
  startedAtMs: Date.now(),
  firstDiscoveryAtMs: null,
  completionAtMs: null,
  discoveriesBySource: { row: 0, grid: 0, triangle: 0 },
  triangleClickCount: 0,
};

let hintKey: string | null = null;
renderAll();

function renderAll(): void {
  const points = partitionPoints(state.n, state.discovered);
  hintKey = points.find((point) => !point.discovered)?.key ?? null;
  const currentKey = safeCurrentKey();

  renderHud(hud, state, hintKey, {
    onNChange: (n) => {
      state = setN(state, n);
      announce(`Set N to ${state.n}`);
      renderAll();
    },
    onModeChange: (mode) => {
      state = setMode(state, mode);
      announce(`Mode changed to ${mode}.`);
      renderAll();
    },
    onReset: () => {
      state = resetDiscovered(state);
      announce("Discovered partitions reset.");
      renderAll();
    },
    onNextN: () => {
      const next = state.n >= 60 ? 1 : state.n + 1;
      state = setN(state, next);
      announce(`Advanced to N=${state.n}`);
      renderAll();
    },
    onHint: () => {
      if (hintKey) {
        announce(`Hint: try partition ${hintKey}`);
      }
    },
    onCopyLink: async () => {
      const url = buildShareUrl(state);
      try {
        await navigator.clipboard.writeText(url);
        announce("Share link copied.");
      } catch {
        announce("Copy failed. Clipboard permission not available.");
      }
    },
    onExportTelemetry: () => {
      const snapshot = {
        ...telemetry,
        elapsedMs: Date.now() - telemetry.startedAtMs,
      };
      localStorage.setItem("splitcoins_telemetry_last", JSON.stringify(snapshot));
      announce("Telemetry saved to localStorage key splitcoins_telemetry_last.");
    },
  });

  renderCoinRow(coinRow, { n: state.n, cutA: state.cutA, cutB: state.cutB }, {
    onSetCuts: (cutA, cutB, source) => transitionToCuts(cutA, cutB, source),
  });

  renderCutGrid(cutGrid, {
    n: state.n,
    cutA: state.cutA,
    cutB: state.cutB,
    discovered: state.discovered,
  }, {
    onSelectCuts: (cutA, cutB, source) => transitionToCuts(cutA, cutB, source),
  });

  renderPartitionTriangle(partitionTriangle, {
    points,
    currentKey,
    hintKey,
  }, {
    onSelectPartition: (key, source) => {
      const representative = representativeCutForPartition(state.n, key);
      if (source === "triangle") {
        telemetry.triangleClickCount += 1;
      }
      transitionToCuts(representative.cutA, representative.cutB, source);
    },
  });
}

function transitionToCuts(cutA: number, cutB: number, source: Source): void {
  const now = Date.now();
  const result = setCuts(state, cutA, cutB, source, now);
  state = result.state;

  if (result.newlyDiscovered) {
    telemetry.discoveriesBySource[source] += 1;
    if (telemetry.firstDiscoveryAtMs === null) {
      telemetry.firstDiscoveryAtMs = now;
    }
    announce(`Discovered partition ${result.partitionKey}.`);
  }

  if (result.completedNow && telemetry.completionAtMs === null) {
    telemetry.completionAtMs = now;
    announce("All partitions discovered.");
  }

  renderAll();
}

function safeCurrentKey(): string | null {
  try {
    return currentPartitionKeyFromCuts(state.cutA, state.cutB, state.n);
  } catch {
    return null;
  }
}

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element;
}

function announce(message: string): void {
  liveRegion.textContent = message;
}
