import "./style.css";
import { partitionPoints } from "./domain/partitionSpace";
import {
  currentPartitionKeyFromCuts,
  isValidCuts,
  normalizeUnordered,
  orderedCutsToParts,
} from "./domain/splitMath";
import {
  attemptDiscover,
  createInitialState,
  resetDiscovered,
  setCurrentCuts,
  setCuts,
  setN,
  type GameState,
  type Source,
} from "./state/gameState";
import { renderCoinRow } from "./ui/coinRow";
import { renderCutGrid } from "./ui/cutGrid";
import { renderHud } from "./ui/hud";
import { renderPartitionTriangle } from "./ui/partitionTriangle";
import { createRenderScheduler } from "./ui/renderScheduler";
import { parseShareState } from "./ui/shareState";
import {
  clampToSvgBounds,
  gridCellId,
  nearestOrderedLatticePoint,
  orderedLatticePoints,
  partsToSvg,
  submitOrderedSplit,
  type DragPosition,
  type SubmittedRow,
  unorderedKeyFromParts,
} from "./ui/rungState";

type Telemetry = {
  startedAtMs: number;
  firstDiscoveryAtMs: number | null;
  completionAtMs: number | null;
  discoveriesBySource: Record<Source, number>;
  triangleDropCount: number;
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
let state: GameState = createInitialState(10);
if (parsed.cutA !== undefined && parsed.cutB !== undefined) {
  state = setCurrentCuts(state, parsed.cutA, parsed.cutB, "row");
}
if (parsed.discovered) {
  state = {
    ...state,
    discovered: new Set(parsed.discovered),
  };
}

let demoCuts = { cutA: state.cutA, cutB: state.cutB };
let submittedRows: SubmittedRow[] = [];
let revealedGridCells = new Set<string>();
let highlightedPermutationKey: string | null = null;
let selectedPartitionKey: string | null = safeCurrentKey(demoCuts.cutA, demoCuts.cutB);
let triangleDragPosition: DragPosition | null = null;
let isTriangleDragging = false;
let triangleAnimationFrame: number | null = null;

const telemetry: Telemetry = {
  startedAtMs: Date.now(),
  firstDiscoveryAtMs: null,
  completionAtMs: null,
  discoveriesBySource: { row: 0, grid: 0, triangle: 0 },
  triangleDropCount: 0,
};

const scheduler = createRenderScheduler(renderAll);
renderAll();

function renderAll(): void {
  const points = partitionPoints(state.n, state.discovered);
  const hintKey = points.find((point) => !point.discovered)?.key ?? null;

  renderHud(hud, state, hintKey, {
    onNChange: (n) => {
      resetForN(n);
      announce(`Set N to ${state.n}`);
      scheduler.flush();
    },
    onReset: () => {
      state = resetDiscovered(state);
      announce("Discovered progress reset.");
      scheduler.flush();
    },
  });

  renderCoinRow(coinRow, {
    n: state.n,
    cutA: demoCuts.cutA,
    cutB: demoCuts.cutB,
    submittedRows,
    canSubmit: isValidCuts(demoCuts.cutA, demoCuts.cutB, state.n),
  }, {
    onChangeCuts: (cutA, cutB, source) => {
      setDemoCuts(cutA, cutB, source, false);
    },
    onSubmit: submitCurrentDemoFromRung0,
    onResetSubmissions: () => {
      submittedRows = [];
      announce("Rung 0 submissions cleared.");
      scheduler.schedule();
    },
  });

  renderCutGrid(cutGrid, {
    n: state.n,
    demoCutA: demoCuts.cutA,
    demoCutB: demoCuts.cutB,
    revealedCells: revealedGridCells,
    highlightedPermutationKey,
  }, {
    onSelectCuts: (cutA, cutB) => {
      revealGridCell(cutA, cutB);
    },
    onHighlightPermutation: (unorderedKey) => {
      if (highlightedPermutationKey === unorderedKey) {
        return;
      }
      highlightedPermutationKey = unorderedKey;
      scheduler.schedule();
    },
    onClearPermutationHighlight: () => {
      if (highlightedPermutationKey === null) {
        return;
      }
      highlightedPermutationKey = null;
      scheduler.schedule();
    },
  });

  renderPartitionTriangle(partitionTriangle, {
    n: state.n,
    points,
    selectedKey: selectedPartitionKey,
    dragPosition: triangleDragPosition,
    isDragging: isTriangleDragging,
  }, {
    onDragMove: (position) => {
      cancelTriangleAnimation();
      isTriangleDragging = true;
      triangleDragPosition = clampToSvgBounds(position);
      scheduler.schedule();
    },
    onDragEnd: (position) => {
      completeTriangleDrop(position);
    },
  });
}

function setDemoCuts(
  cutA: number,
  cutB: number,
  source: Source,
  discover: boolean,
  options: { preserveTrianglePosition?: boolean } = {},
): void {
  if (!isValidCuts(cutA, cutB, state.n)) {
    return;
  }

  demoCuts = { cutA, cutB };
  selectedPartitionKey = safeCurrentKey(cutA, cutB);
  if (!options.preserveTrianglePosition) {
    triangleDragPosition = null;
  }
  isTriangleDragging = false;

  if (!discover) {
    state = setCurrentCuts(state, cutA, cutB, source);
    scheduler.schedule();
    return;
  }

  const now = Date.now();
  const result = setCuts(state, cutA, cutB, source, now);
  state = result.state;
  const discoveryMessage = applyDiscoverResult(result, source, now);
  if (discoveryMessage) {
    announce(discoveryMessage);
  }
  scheduler.schedule();
}

function submitCurrentDemoFromRung0(): void {
  if (!isValidCuts(demoCuts.cutA, demoCuts.cutB, state.n)) {
    return;
  }

  const now = Date.now();
  const parts = orderedCutsToParts(demoCuts.cutA, demoCuts.cutB, state.n);
  const unorderedKey = unorderedKeyFromParts(parts);
  const hadRow = submittedRows.some((row) => row.unorderedKey === unorderedKey);
  submittedRows = submitOrderedSplit(submittedRows, parts, now);

  const result = attemptDiscover(state, now);
  state = result.state;
  const discoveryMessage = applyDiscoverResult(result, "row", now);
  const fallbackMessage = hadRow
    ? `Logged reordered duplicate ${parts.join(" | ")}.`
    : `Logged ${parts.join(" | ")}.`;
  announce(discoveryMessage ?? fallbackMessage);
  scheduler.schedule();
}

function revealGridCell(cutA: number, cutB: number): void {
  revealedGridCells = new Set(revealedGridCells);
  revealedGridCells.add(gridCellId(cutA, cutB));
  setDemoCuts(cutA, cutB, "grid", true);
}

function completeTriangleDrop(position: DragPosition): void {
  const clamped = clampToSvgBounds(position);
  const target = nearestOrderedLatticePoint(orderedLatticePoints(state.n), clamped, 18);

  isTriangleDragging = false;

  if (!target) {
    triangleDragPosition = null;
    scheduler.schedule();
    return;
  }

  telemetry.triangleDropCount += 1;
  const sortedParts = normalizeUnordered(target.parts);
  const sortedKey = sortedParts.join("+");
  const cutA = sortedParts[0];
  const cutB = sortedParts[0] + sortedParts[1];
  triangleDragPosition = { x: target.x, y: target.y };
  selectedPartitionKey = sortedKey;
  setDemoCuts(cutA, cutB, "triangle", true, { preserveTrianglePosition: true });
  animateTriangleMarkerTo(partsToSvg(sortedParts, state.n));
}

function resetForN(n: number): void {
  state = setN(state, n);
  demoCuts = { cutA: state.cutA, cutB: state.cutB };
  submittedRows = [];
  revealedGridCells = new Set();
  highlightedPermutationKey = null;
  selectedPartitionKey = safeCurrentKey(state.cutA, state.cutB);
  triangleDragPosition = null;
  isTriangleDragging = false;
  cancelTriangleAnimation();
}

function applyDiscoverResult(
  result: ReturnType<typeof setCuts> | ReturnType<typeof attemptDiscover>,
  source: Source,
  now: number,
): string | null {
  if (result.newlyDiscovered) {
    telemetry.discoveriesBySource[source] += 1;
    if (telemetry.firstDiscoveryAtMs === null) {
      telemetry.firstDiscoveryAtMs = now;
    }
  }

  if (result.completedNow && telemetry.completionAtMs === null) {
    telemetry.completionAtMs = now;
  }

  if (result.completedNow && result.partitionKey) {
    return `Discovered partition ${result.partitionKey}. All partitions found.`;
  }

  if (result.newlyDiscovered && result.partitionKey) {
    return `Discovered partition ${result.partitionKey}.`;
  }

  return null;
}

function safeCurrentKey(cutA: number, cutB: number): string | null {
  try {
    return currentPartitionKeyFromCuts(cutA, cutB, state.n);
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

function animateTriangleMarkerTo(target: DragPosition): void {
  cancelTriangleAnimation();
  const start = triangleDragPosition;
  if (!start) {
    scheduler.schedule();
    return;
  }

  const startTime = performance.now();
  const durationMs = 260;

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    triangleDragPosition = {
      x: start.x + ((target.x - start.x) * eased),
      y: start.y + ((target.y - start.y) * eased),
    };
    scheduler.schedule();

    if (progress >= 1) {
      triangleDragPosition = null;
      triangleAnimationFrame = null;
      scheduler.schedule();
      return;
    }

    triangleAnimationFrame = window.requestAnimationFrame(tick);
  };

  triangleAnimationFrame = window.requestAnimationFrame(tick);
}

function cancelTriangleAnimation(): void {
  if (triangleAnimationFrame !== null) {
    window.cancelAnimationFrame(triangleAnimationFrame);
    triangleAnimationFrame = null;
  }
}
