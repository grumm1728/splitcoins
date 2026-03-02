import { orderedCutsToParts, type Parts3 } from "../domain/splitMath";
import { gridCellId, unorderedKeyFromParts } from "./rungState";

export type CutGridState = {
  n: number;
  demoCutA: number;
  demoCutB: number;
  revealedCells: ReadonlySet<string>;
  highlightedPermutationKey: string | null;
};

type CutGridCallbacks = {
  onSelectCuts: (cutA: number, cutB: number) => void;
  onHighlightPermutation: (unorderedKey: string) => void;
  onClearPermutationHighlight: () => void;
};

export type CutGridCellModel = {
  cutA: number;
  cutB: number;
  parts: Parts3;
  key: string;
  unorderedKey: string;
  rowIndex: number;
  colIndex: number;
  revealed: boolean;
  permutationHighlighted: boolean;
  activeDemo: boolean;
};

export type CutGridRowModel = {
  rowLabel: number;
  cells: CutGridCellModel[];
};

type CutGridDom = {
  n: number;
  article: HTMLElement;
  coins: HTMLDivElement;
  handleA: HTMLSpanElement;
  handleB: HTMLSpanElement;
  readout: HTMLParagraphElement;
  cellButtons: Map<string, HTMLButtonElement>;
  coinEls: HTMLSpanElement[];
  state: CutGridState;
  callbacks: CutGridCallbacks;
};

const cutGrids = new WeakMap<HTMLElement, CutGridDom>();

export function renderCutGrid(
  container: HTMLElement,
  state: CutGridState,
  callbacks: CutGridCallbacks,
): void {
  let dom = cutGrids.get(container);
  if (!dom || dom.n !== state.n) {
    dom = buildCutGrid(container, state, callbacks);
    cutGrids.set(container, dom);
  }

  dom.state = state;
  dom.callbacks = callbacks;
  if (dom.coinEls.length !== state.n) {
    syncCoins(dom, state.n);
  }
  updateCutGrid(dom);
}

export function buildCutGridRows(state: CutGridState): CutGridRowModel[] {
  if (state.n < 3) {
    return [];
  }

  const rows: CutGridRowModel[] = [];
  for (let cutA = 1; cutA <= state.n - 2; cutA += 1) {
    const cells: CutGridCellModel[] = [];
    let colIndex = 0;
    for (let cutB = cutA + 1; cutB <= state.n - 1; cutB += 1) {
      const parts = orderedCutsToParts(cutA, cutB, state.n);
      const key = gridCellId(cutA, cutB);
      const unorderedKey = unorderedKeyFromParts(parts);
      cells.push({
        cutA,
        cutB,
        parts,
        key,
        unorderedKey,
        rowIndex: cutA - 1,
        colIndex,
        revealed: state.revealedCells.has(key),
        permutationHighlighted: state.highlightedPermutationKey === unorderedKey,
        activeDemo: cutA === state.demoCutA && cutB === state.demoCutB,
      });
      colIndex += 1;
    }
    rows.push({ rowLabel: cutA, cells });
  }

  return rows;
}

function buildCutGrid(
  container: HTMLElement,
  state: CutGridState,
  callbacks: CutGridCallbacks,
): CutGridDom {
  const rows = buildCutGridRows(state);
  container.innerHTML = `
    <article class="card rung">
      <h2>Rung 1: Reveal Ordered Cuts</h2>
      <p>Click a hidden cut to reveal it and update the split diagram. Hover highlights its permutations only.</p>
      <div class="coin-track coin-track-readonly" id="grid-track">
        <div class="coins" id="grid-coins"></div>
        <span id="grid-handle-a" class="handle handle-static handle-muted" aria-hidden="true"></span>
        <span id="grid-handle-b" class="handle handle-static handle-muted" aria-hidden="true"></span>
      </div>
      <p id="grid-readout" class="split-readout"></p>
      <div id="grid-matrix" class="cut-grid-matrix"></div>
    </article>
  `;

  const article = byId<HTMLElement>(container, ".rung");
  const coins = byId<HTMLDivElement>(container, "#grid-coins");
  const handleA = byId<HTMLSpanElement>(container, "#grid-handle-a");
  const handleB = byId<HTMLSpanElement>(container, "#grid-handle-b");
  const readout = byId<HTMLParagraphElement>(container, "#grid-readout");
  const matrix = byId<HTMLDivElement>(container, "#grid-matrix");
  const cellButtons = new Map<string, HTMLButtonElement>();

  const dom: CutGridDom = {
    n: state.n,
    article,
    coins,
    handleA,
    handleB,
    readout,
    cellButtons,
    coinEls: [],
    state,
    callbacks,
  };

  for (const row of rows) {
    const rowEl = document.createElement("div");
    rowEl.className = "cut-grid-row";

    const label = document.createElement("div");
    label.className = "cut-grid-row-label";
    label.textContent = `a=${row.rowLabel}`;
    rowEl.appendChild(label);

    const cells = document.createElement("div");
    cells.className = "cut-grid-row-cells";

    for (const cell of row.cells) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "grid-cell grid-cell-hidden";
      button.dataset.cuta = String(cell.cutA);
      button.dataset.cutb = String(cell.cutB);
      button.dataset.key = cell.key;
      button.dataset.unorderedKey = cell.unorderedKey;
      button.addEventListener("click", () => {
        dom.callbacks.onSelectCuts(cell.cutA, cell.cutB);
      });
      button.addEventListener("mouseenter", () => {
        dom.callbacks.onHighlightPermutation(cell.unorderedKey);
      });
      button.addEventListener("focus", () => {
        dom.callbacks.onHighlightPermutation(cell.unorderedKey);
      });
      cells.appendChild(button);
      cellButtons.set(cell.key, button);
    }

    rowEl.appendChild(cells);
    matrix.appendChild(rowEl);
  }

  article.addEventListener("mouseleave", () => dom.callbacks.onClearPermutationHighlight());
  article.addEventListener("focusout", (event) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof HTMLElement && article.contains(nextTarget)) {
      return;
    }
    dom.callbacks.onClearPermutationHighlight();
  });

  syncCoins(dom, state.n);
  return dom;
}

function updateCutGrid(dom: CutGridDom): void {
  const { state } = dom;
  const valid = state.n >= 3;
  const parts = valid ? orderedCutsToParts(state.demoCutA, state.demoCutB, state.n) : null;
  const left = dividerPositionPercent(state.demoCutA, state.n);
  const right = dividerPositionPercent(state.demoCutB, state.n);

  dom.handleA.style.left = `${left}%`;
  dom.handleB.style.left = `${right}%`;
  dom.readout.innerHTML = parts
    ? `Diagram split: <strong>${parts[0]} | ${parts[1]} | ${parts[2]}</strong>`
    : "Need at least N=3 to form three non-empty piles.";

  dom.coinEls.forEach((coin, index) => {
    const position = index + 1;
    const group = position <= state.demoCutA ? "g1" : position <= state.demoCutB ? "g2" : "g3";
    coin.className = `coin ${group}`;
  });

  const rows = buildCutGridRows(state);
  for (const row of rows) {
    for (const cell of row.cells) {
      const button = dom.cellButtons.get(cell.key);
      if (!button) {
        continue;
      }
      button.textContent = cell.revealed ? `${cell.parts[0]} | ${cell.parts[1]} | ${cell.parts[2]}` : "";
      button.classList.toggle("grid-cell-hidden", !cell.revealed);
      button.classList.toggle("permutation-match", cell.permutationHighlighted);
      button.classList.toggle("current", cell.activeDemo);
      button.setAttribute(
        "aria-label",
        `Ordered split ${cell.parts[0]}, ${cell.parts[1]}, ${cell.parts[2]}`,
      );
      button.title = `${cell.parts[0]} | ${cell.parts[1]} | ${cell.parts[2]}`;
    }
  }
}

function syncCoins(dom: CutGridDom, n: number): void {
  dom.coins.innerHTML = "";
  dom.coinEls = [];
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < n; index += 1) {
    const coin = document.createElement("span");
    coin.className = "coin";
    dom.coinEls.push(coin);
    fragment.appendChild(coin);
  }
  dom.coins.appendChild(fragment);
}

function byId<T extends Element>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element ${selector}`);
  }
  return element;
}

function dividerPositionPercent(cut: number, n: number): number {
  if (n < 1) {
    return 0;
  }
  return ((cut + 0.5) / (n + 1)) * 100;
}
