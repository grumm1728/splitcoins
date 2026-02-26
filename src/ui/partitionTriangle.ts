import type { PartitionPoint } from "../domain/partitionSpace";
import type { Source } from "../state/gameState";

type PartitionTriangleCallbacks = {
  onSelectPartition: (key: string, source: Source) => void;
  onPreviewPartition: (key: string) => void;
  onClearPreview: () => void;
};

type PartitionTriangleState = {
  points: PartitionPoint[];
  currentKey: string | null;
  hintKey: string | null;
};

export function renderPartitionTriangle(
  container: HTMLElement,
  state: PartitionTriangleState,
  callbacks: PartitionTriangleCallbacks,
): void {
  const circles = state.points.map((point) => {
    const cx = 20 + point.x * 360;
    const cy = 340 - point.y * 360;
    const radius = point.multiplicity === 1 ? 5 : point.multiplicity === 3 ? 7 : 9;
    const current = point.key === state.currentKey;
    const hint = point.key === state.hintKey;
    return `
      <g>
        <circle
          class="tri-point ${point.discovered ? "discovered" : ""} ${current ? "current" : ""} ${hint ? "hint" : ""}"
          cx="${cx}"
          cy="${cy}"
          r="${radius}"
          data-key="${point.key}"
        />
      </g>
    `;
  }).join("");

  container.innerHTML = `
    <article class="card rung">
      <h2>Rung 2: Partition Triangle</h2>
      <p>One point per unordered partition (a<=b<=c). Dot size encodes multiplicity 1, 3, or 6.</p>
      <svg class="triangle" viewBox="0 0 400 360" role="img" aria-label="Partition triangle view">
        <polygon points="20,340 380,340 200,28" class="tri-outline"></polygon>
        ${circles}
      </svg>
    </article>
  `;

  container.querySelectorAll<SVGCircleElement>(".tri-point").forEach((circle) => {
    circle.addEventListener("click", () => {
      const key = circle.dataset.key;
      if (key) {
        callbacks.onSelectPartition(key, "triangle");
      }
    });
    circle.addEventListener("mouseenter", () => {
      const key = circle.dataset.key;
      if (key) {
        callbacks.onPreviewPartition(key);
      }
    });
  });

  const triangle = container.querySelector<SVGElement>(".triangle");
  triangle?.addEventListener("mouseleave", callbacks.onClearPreview);
}
