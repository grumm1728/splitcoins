import { orderedCutPoints } from "../domain/cutGrid";
import type { Source } from "../state/gameState";

type CutGridState = {
  n: number;
  cutA: number;
  cutB: number;
  discovered: ReadonlySet<string>;
};

type CutGridCallbacks = {
  onSelectCuts: (cutA: number, cutB: number, source: Source) => void;
};

export function renderCutGrid(
  container: HTMLElement,
  state: CutGridState,
  callbacks: CutGridCallbacks,
): void {
  const points = orderedCutPoints(state.n);
  const rows: string[] = [];
  for (let cutA = 1; cutA <= state.n - 2; cutA += 1) {
    const cells: string[] = [];
    for (let cutB = cutA + 1; cutB <= state.n - 1; cutB += 1) {
      const point = points.find((entry) => entry.cutA === cutA && entry.cutB === cutB);
      if (!point) {
        continue;
      }
      const current = cutA === state.cutA && cutB === state.cutB;
      const discovered = state.discovered.has(point.key);
      cells.push(`
        <button
          type="button"
          class="grid-cell ${current ? "current" : ""} ${discovered ? "discovered" : ""}"
          data-cuta="${cutA}"
          data-cutb="${cutB}"
          title="Cuts ${cutA}|${cutB} -> ${point.key}"
        >
          ${cutA}|${cutB}
        </button>
      `);
    }
    rows.push(`<div class="grid-row">${cells.join("")}</div>`);
  }

  container.innerHTML = `
    <article class="card rung">
      <h2>Rung 1: Ordered Cut Grid</h2>
      <p>Every ordered pair (cutA, cutB). Colors mirror discovered unordered outcomes.</p>
      <div class="cut-grid">${rows.join("")}</div>
    </article>
  `;

  container.querySelectorAll<HTMLButtonElement>(".grid-cell").forEach((button) => {
    button.addEventListener("click", () => {
      const cutA = Number(button.dataset.cuta);
      const cutB = Number(button.dataset.cutb);
      callbacks.onSelectCuts(cutA, cutB, "grid");
    });
    button.addEventListener("mouseenter", () => {
      const cutA = Number(button.dataset.cuta);
      const cutB = Number(button.dataset.cutb);
      callbacks.onSelectCuts(cutA, cutB, "grid");
    });
  });
}

