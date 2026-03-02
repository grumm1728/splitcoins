import type { Source } from "../state/gameState";
import { isValidCuts, orderedCutsToParts } from "../domain/splitMath";
import type { SubmittedRow } from "./rungState";

type CoinRowCallbacks = {
  onChangeCuts: (cutA: number, cutB: number, source: Source) => void;
  onSubmit: () => void;
  onResetSubmissions: () => void;
};

export type CoinRowState = {
  n: number;
  cutA: number;
  cutB: number;
  submittedRows: SubmittedRow[];
  canSubmit: boolean;
};

type CoinRowDom = {
  track: HTMLDivElement;
  coins: HTMLDivElement;
  handleA: HTMLButtonElement;
  handleB: HTMLButtonElement;
  readout: HTMLParagraphElement;
  submitBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  list: HTMLDivElement;
  coinEls: HTMLSpanElement[];
  state: CoinRowState;
  callbacks: CoinRowCallbacks;
};

const coinRows = new WeakMap<HTMLElement, CoinRowDom>();

export function renderCoinRow(
  container: HTMLElement,
  state: CoinRowState,
  callbacks: CoinRowCallbacks,
): void {
  let dom = coinRows.get(container);
  if (!dom) {
    dom = buildCoinRow(container, state, callbacks);
    coinRows.set(container, dom);
  }

  dom.state = state;
  dom.callbacks = callbacks;
  if (dom.coinEls.length !== state.n) {
    syncCoins(dom, state.n);
  }
  updateCoinRow(dom);
}

export function nextCutsForHandle(
  which: "a" | "b",
  proposedSlot: number,
  state: Pick<CoinRowState, "n" | "cutA" | "cutB">,
): { cutA: number; cutB: number } {
  if (which === "a") {
    return {
      cutA: clamp(proposedSlot, 1, state.cutB - 1),
      cutB: state.cutB,
    };
  }

  return {
    cutA: state.cutA,
    cutB: clamp(proposedSlot, state.cutA + 1, state.n - 1),
  };
}

function buildCoinRow(
  container: HTMLElement,
  state: CoinRowState,
  callbacks: CoinRowCallbacks,
): CoinRowDom {
  container.innerHTML = `
    <article class="card rung">
      <h2>Rung 0: Submit Ordered Splits</h2>
      <p>Drag both separators to choose an ordered split, then submit it to your running history.</p>
      <div class="coin-track" id="coin-track">
        <div class="coins" id="coin-list"></div>
        <button id="handle-a" class="handle" type="button"></button>
        <button id="handle-b" class="handle" type="button"></button>
      </div>
      <p id="split-readout" class="split-readout"></p>
      <div class="rung-actions">
        <button id="submit-btn" class="button-cta" type="button">Submit partition</button>
        <button id="reset-found-btn" type="button">Reset found</button>
      </div>
      <div id="submission-list" class="submission-list"></div>
    </article>
  `;

  const track = byId<HTMLDivElement>(container, "#coin-track");
  const coins = byId<HTMLDivElement>(container, "#coin-list");
  const handleA = byId<HTMLButtonElement>(container, "#handle-a");
  const handleB = byId<HTMLButtonElement>(container, "#handle-b");
  const readout = byId<HTMLParagraphElement>(container, "#split-readout");
  const submitBtn = byId<HTMLButtonElement>(container, "#submit-btn");
  const resetBtn = byId<HTMLButtonElement>(container, "#reset-found-btn");
  const list = byId<HTMLDivElement>(container, "#submission-list");

  const dom: CoinRowDom = {
    track,
    coins,
    handleA,
    handleB,
    readout,
    submitBtn,
    resetBtn,
    list,
    coinEls: [],
    state,
    callbacks,
  };

  syncCoins(dom, state.n);

  attachPointerDrag(handleA, "a", dom);
  attachPointerDrag(handleB, "b", dom);
  attachKeyboard(handleA, "a", dom);
  attachKeyboard(handleB, "b", dom);
  submitBtn.addEventListener("click", () => dom.callbacks.onSubmit());
  resetBtn.addEventListener("click", () => dom.callbacks.onResetSubmissions());

  return dom;
}

function updateCoinRow(dom: CoinRowDom): void {
  const { state, handleA, handleB, readout, track, submitBtn, list } = dom;
  const { n, cutA, cutB } = state;
  const valid = isValidCuts(cutA, cutB, n);
  const parts = valid ? orderedCutsToParts(cutA, cutB, n) : null;
  const left = dividerPositionPercent(cutA, n);
  const right = dividerPositionPercent(cutB, n);
  const disabled = n < 3;

  track.classList.toggle("coin-track-disabled", disabled);
  handleA.disabled = disabled;
  handleB.disabled = disabled;
  handleA.style.left = `${left}%`;
  handleB.style.left = `${right}%`;
  handleA.setAttribute("role", "slider");
  handleB.setAttribute("role", "slider");
  handleA.setAttribute("aria-label", "First cut");
  handleB.setAttribute("aria-label", "Second cut");
  handleA.setAttribute("aria-valuemin", "1");
  handleA.setAttribute("aria-valuemax", String(Math.max(1, n - 2)));
  handleA.setAttribute("aria-valuenow", String(Math.max(1, cutA)));
  handleB.setAttribute("aria-valuemin", "2");
  handleB.setAttribute("aria-valuemax", String(Math.max(2, n - 1)));
  handleB.setAttribute("aria-valuenow", String(Math.max(2, cutB)));
  submitBtn.disabled = !state.canSubmit || disabled;

  dom.coinEls.forEach((coin, index) => {
    const position = index + 1;
    const group = position <= cutA ? "g1" : position <= cutB ? "g2" : "g3";
    coin.className = `coin ${group}`;
  });

  readout.innerHTML = parts
    ? `Current split: <strong>${parts[0]} | ${parts[1]} | ${parts[2]}</strong>`
    : "Need at least N=3 to form three non-empty piles.";

  list.innerHTML = renderSubmissionList(state.submittedRows);
}

function syncCoins(dom: CoinRowDom, n: number): void {
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

function renderSubmissionList(rows: SubmittedRow[]): string {
  if (rows.length === 0) {
    return `<p class="submission-empty">No ordered submissions yet.</p>`;
  }

  const items = rows.map((row) => {
    const duplicates = row.duplicateOrders
      .map((parts) => `<span class="submission-duplicate">Reordered duplicate: ${parts.join(" | ")}</span>`)
      .join("");

    return `
      <li class="submission-item">
        <span class="submission-primary">${row.primaryOrder.join(" | ")}</span>
        ${duplicates}
      </li>
    `;
  }).join("");

  return `<ol class="submission-items">${items}</ol>`;
}

function attachPointerDrag(
  handle: HTMLButtonElement,
  which: "a" | "b",
  dom: CoinRowDom,
): void {
  handle.addEventListener("pointerdown", (event) => {
    if (dom.state.n < 3) {
      return;
    }

    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    handle.classList.add("dragging");
    dom.track.classList.add("dragging");

    const move = (clientX: number) => {
      const rect = dom.track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / Math.max(1, rect.width);
      const slot = Math.round(ratio * dom.state.n);
      const nextCuts = nextCutsForHandle(which, slot, dom.state);
      dom.callbacks.onChangeCuts(nextCuts.cutA, nextCuts.cutB, "row");
    };

    move(event.clientX);

    const finish = () => {
      handle.classList.remove("dragging");
      dom.track.classList.remove("dragging");
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
    };

    const onMove = (pointerMove: PointerEvent) => move(pointerMove.clientX);
    const onEnd = () => finish();

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  });
}

function attachKeyboard(
  handle: HTMLButtonElement,
  which: "a" | "b",
  dom: CoinRowDom,
): void {
  handle.addEventListener("keydown", (event) => {
    if (dom.state.n < 3) {
      return;
    }

    const step = event.shiftKey ? 5 : 1;
    let nextCuts: { cutA: number; cutB: number } | null = null;

    if (event.key === "ArrowLeft") {
      nextCuts = nextCutsForHandle(which, (which === "a" ? dom.state.cutA : dom.state.cutB) - step, dom.state);
    } else if (event.key === "ArrowRight") {
      nextCuts = nextCutsForHandle(which, (which === "a" ? dom.state.cutA : dom.state.cutB) + step, dom.state);
    } else if (event.key === "Home") {
      nextCuts = nextCutsForHandle(which, which === "a" ? 1 : dom.state.cutA + 1, dom.state);
    } else if (event.key === "End") {
      nextCuts = nextCutsForHandle(which, which === "a" ? dom.state.cutB - 1 : dom.state.n - 1, dom.state);
    } else if (event.key === "Escape") {
      handle.blur();
      return;
    }

    if (!nextCuts) {
      return;
    }

    event.preventDefault();
    dom.callbacks.onChangeCuts(nextCuts.cutA, nextCuts.cutB, "row");
  });
}

function byId<T extends Element>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element ${selector}`);
  }
  return element;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dividerPositionPercent(cut: number, n: number): number {
  if (n < 1) {
    return 0;
  }
  return ((cut + 0.5) / (n + 1)) * 100;
}
