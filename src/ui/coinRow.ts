import type { Source } from "../state/gameState";
import { isValidCuts, orderedCutsToParts } from "../domain/splitMath";

type CoinRowCallbacks = {
  onSetCuts: (cutA: number, cutB: number, source: Source) => void;
};

type CoinRowState = {
  n: number;
  cutA: number;
  cutB: number;
};

export function renderCoinRow(
  container: HTMLElement,
  state: CoinRowState,
  callbacks: CoinRowCallbacks,
): void {
  const { n, cutA, cutB } = state;
  const valid = isValidCuts(cutA, cutB, n);
  const parts = valid ? orderedCutsToParts(cutA, cutB, n) : null;
  const left = n > 0 ? (cutA / n) * 100 : 0;
  const right = n > 0 ? (cutB / n) * 100 : 0;
  const coins = buildCoins(n, cutA, cutB);

  container.innerHTML = `
    <article class="card rung">
      <h2>Rung 0: Concrete Coin Row</h2>
      <p>Drag separators to split one pile into three non-empty piles.</p>
      <div class="coin-track" id="coin-track">
        <div class="coins">${coins}</div>
        <button
          id="handle-a"
          class="handle"
          role="slider"
          aria-label="First cut"
          aria-valuemin="1"
          aria-valuemax="${Math.max(1, n - 2)}"
          aria-valuenow="${Math.max(1, cutA)}"
          style="left:${left}%"
          type="button"
          ${n < 3 ? "disabled" : ""}
        ></button>
        <button
          id="handle-b"
          class="handle"
          role="slider"
          aria-label="Second cut"
          aria-valuemin="2"
          aria-valuemax="${Math.max(2, n - 1)}"
          aria-valuenow="${Math.max(2, cutB)}"
          style="left:${right}%"
          type="button"
          ${n < 3 ? "disabled" : ""}
        ></button>
      </div>
      <p class="split-readout">
        ${parts ? `Current split: <strong>${parts[0]} + ${parts[1]} + ${parts[2]}</strong>` : "Need at least N=3 to form three non-empty piles."}
      </p>
    </article>
  `;

  if (n < 3) {
    return;
  }

  const track = byId<HTMLDivElement>(container, "coin-track");
  const handleA = byId<HTMLButtonElement>(container, "handle-a");
  const handleB = byId<HTMLButtonElement>(container, "handle-b");

  attachPointerDrag(handleA, "a", track, state, callbacks.onSetCuts);
  attachPointerDrag(handleB, "b", track, state, callbacks.onSetCuts);
  attachKeyboard(handleA, "a", state, callbacks.onSetCuts);
  attachKeyboard(handleB, "b", state, callbacks.onSetCuts);
}

function buildCoins(n: number, cutA: number, cutB: number): string {
  if (n < 1) {
    return "";
  }
  return Array.from({ length: n }, (_, index) => {
    const position = index + 1;
    const group = position <= cutA ? "g1" : position <= cutB ? "g2" : "g3";
    return `<span class="coin ${group}"></span>`;
  }).join("");
}

function attachPointerDrag(
  handle: HTMLButtonElement,
  which: "a" | "b",
  track: HTMLDivElement,
  state: CoinRowState,
  onSetCuts: (cutA: number, cutB: number, source: Source) => void,
): void {
  handle.addEventListener("pointerdown", (event) => {
    handle.setPointerCapture(event.pointerId);
    const move = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / Math.max(1, rect.width);
      const slot = Math.round(ratio * state.n);
      if (which === "a") {
        const cutA = clamp(slot, 1, state.cutB - 1);
        onSetCuts(cutA, state.cutB, "row");
      } else {
        const cutB = clamp(slot, state.cutA + 1, state.n - 1);
        onSetCuts(state.cutA, cutB, "row");
      }
    };

    move(event.clientX);
    const onMove = (pointerMove: PointerEvent) => move(pointerMove.clientX);
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  });
}

function attachKeyboard(
  handle: HTMLButtonElement,
  which: "a" | "b",
  state: CoinRowState,
  onSetCuts: (cutA: number, cutB: number, source: Source) => void,
): void {
  handle.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 5 : 1;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -step : step;
    if (which === "a") {
      const cutA = clamp(state.cutA + delta, 1, state.cutB - 1);
      onSetCuts(cutA, state.cutB, "row");
      return;
    }
    const cutB = clamp(state.cutB + delta, state.cutA + 1, state.n - 1);
    onSetCuts(state.cutA, cutB, "row");
  });
}

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector<HTMLElement>(`#${id}`);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

