import { countByFormula } from "../domain/splitMath";
import type { GameState } from "../state/gameState";

export type HudCallbacks = {
  onNChange: (n: number) => void;
  onReset: () => void;
  onNextN: () => void;
  onHint: () => void;
  onCopyLink: () => void;
  onExportTelemetry: () => void;
};

export function renderHud(
  container: HTMLElement,
  state: GameState,
  hintKey: string | null,
  callbacks: HudCallbacks,
): void {
  const found = state.discovered.size;
  const total = state.total;
  const done = found === total && total > 0;
  const formula = countByFormula(state.n, 3);

  container.innerHTML = `
    <header class="hero">
      <p class="eyebrow">Ladder of Abstraction</p>
      <h1>SplitCoins</h1>
      <p class="subtitle">Drag cuts on real coins, then climb through cut-space and partition-space.</p>
    </header>
    <section class="hud-panel">
      <div class="hud-controls">
        <label>N coins
          <input id="n-input" type="number" min="1" max="60" step="1" value="${state.n}" />
        </label>
      </div>
      <div class="hud-meta">
        <p class="summary-line"><strong>Progress:</strong> ${found}/${total} discovered</p>
        <p class="summary-line"><strong>Formula:</strong> round(N^2/12) = ${formula}</p>
        <p class="summary-line ${done ? "ok" : ""}"><strong>Status:</strong> ${done ? "All partitions found." : "Keep exploring."}</p>
      </div>
      <div class="hud-actions">
        <button id="reset-btn" type="button">Reset discovered</button>
        <button id="next-btn" type="button">Next N</button>
        <button id="hint-btn" type="button" ${hintKey ? "" : "disabled"}>Hint</button>
        <button id="copy-btn" type="button">Copy link</button>
        <button id="telemetry-btn" type="button">Export telemetry</button>
      </div>
      <p class="mode-note">Hover previews, click commits, drag discovers.</p>
    </section>
  `;

  const nInput = byId<HTMLInputElement>(container, "n-input");
  const resetBtn = byId<HTMLButtonElement>(container, "reset-btn");
  const nextBtn = byId<HTMLButtonElement>(container, "next-btn");
  const hintBtn = byId<HTMLButtonElement>(container, "hint-btn");
  const copyBtn = byId<HTMLButtonElement>(container, "copy-btn");
  const telemetryBtn = byId<HTMLButtonElement>(container, "telemetry-btn");

  nInput.addEventListener("change", () => callbacks.onNChange(Number(nInput.value)));
  resetBtn.addEventListener("click", callbacks.onReset);
  nextBtn.addEventListener("click", callbacks.onNextN);
  hintBtn.addEventListener("click", callbacks.onHint);
  copyBtn.addEventListener("click", callbacks.onCopyLink);
  telemetryBtn.addEventListener("click", callbacks.onExportTelemetry);
}

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector<HTMLElement>(`#${id}`);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

