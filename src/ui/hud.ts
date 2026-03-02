import { countByFormula } from "../domain/splitMath";
import type { GameState } from "../state/gameState";

export type HudCallbacks = {
  onNChange: (n: number) => void;
  onReset: () => void;
};

export function renderHud(
  container: HTMLElement,
  state: GameState,
  _hintKey: string | null,
  callbacks: HudCallbacks,
): void {
  const found = state.discovered.size;
  const total = state.total;
  const done = found === total && total > 0;
  const formula = countByFormula(state.n, 3);

  container.innerHTML = `
    <header class="hero">
      <div class="hero-head">
        <div class="hero-mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" role="presentation">
            <defs>
              <linearGradient id="lid-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f1d28a"></stop>
                <stop offset="100%" stop-color="#8e6328"></stop>
              </linearGradient>
              <linearGradient id="wood" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#83532a"></stop>
                <stop offset="100%" stop-color="#3b2412"></stop>
              </linearGradient>
            </defs>
            <path d="M20 52 C28 25, 92 25, 100 52 L100 64 L20 64 Z" fill="url(#wood)"></path>
            <path d="M18 56 C26 31, 94 31, 102 56 L96 62 C86 40, 34 40, 24 62 Z" fill="url(#lid-shine)"></path>
            <rect x="22" y="60" width="76" height="40" rx="8" fill="url(#wood)"></rect>
            <rect x="26" y="66" width="68" height="26" rx="6" fill="#6e431f"></rect>
            <rect x="56" y="54" width="8" height="46" rx="3" fill="#d8af57"></rect>
            <rect x="30" y="48" width="8" height="52" rx="3" fill="#d8af57"></rect>
            <rect x="82" y="48" width="8" height="52" rx="3" fill="#d8af57"></rect>
            <circle cx="60" cy="80" r="8" fill="#e6c56c"></circle>
            <circle cx="60" cy="80" r="3.5" fill="#7b5927"></circle>
            <path d="M42 92 C52 98, 68 98, 78 92" fill="none" stroke="#f0d891" stroke-width="4" stroke-linecap="round"></path>
          </svg>
        </div>
        <div class="hero-copy">
          <p class="eyebrow">Treasure Ledger of Partitions</p>
          <h1>SplitCoins</h1>
          <p class="subtitle">Submit ordered splits in rung 0, reveal hidden cuts in rung 1, and steer the treasure marker home through partition space in rung 2.</p>
        </div>
      </div>
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
      </div>
      <p class="mode-note">Rung 0 logs the treasure. Rung 1 uncovers the map. Rung 2 sails each split back to its home cove.</p>
    </section>
  `;

  const nInput = byId<HTMLInputElement>(container, "n-input");
  const resetBtn = byId<HTMLButtonElement>(container, "reset-btn");

  nInput.addEventListener("change", () => callbacks.onNChange(Number(nInput.value)));
  resetBtn.addEventListener("click", callbacks.onReset);
}

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector<HTMLElement>(`#${id}`);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}
