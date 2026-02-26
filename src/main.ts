import "./style.css";
import {
  enumeratePartitions,
  isValidPartition,
  partitionKey,
  type Partition,
} from "./math/partitions";
import { countByFormula } from "./math/formulas";
import { buildReferenceTable } from "./math/verify";

type Mode = "explorer" | "challenge";

type ChallengeLevel = {
  n: number;
  k: 2 | 3;
  expected: Set<string>;
  submitted: Set<string>;
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = `
  <div class="shell">
    <header class="hero">
      <p class="eyebrow">Interactive Math Lab</p>
      <h1>SplitCoins</h1>
      <p class="subtitle">Explore and play with unordered partitions of N coins into 1, 2, or 3 piles.</p>
    </header>

    <section class="mode-switch">
      <button id="mode-explorer" class="tab active" type="button">Explorer</button>
      <button id="mode-challenge" class="tab" type="button">Challenge</button>
    </section>

    <section id="explorer-panel" class="panel">
      <div class="controls">
        <label>N
          <input id="explorer-n" type="number" min="1" max="200" step="1" value="12" />
        </label>
        <label>Piles (k)
          <select id="explorer-k">
            <option value="1">1 pile</option>
            <option value="2">2 piles</option>
            <option value="3" selected>3 piles</option>
          </select>
        </label>
      </div>
      <div id="explorer-summary" class="summary"></div>
      <div class="grid">
        <article class="card">
          <h2>Partitions</h2>
          <p id="partition-caption"></p>
          <ul id="partition-list" class="partition-list"></ul>
        </article>
        <article class="card">
          <h2>Reference Table (N = 1..15)</h2>
          <p>Must match the prompt values.</p>
          <div class="table-wrap">
            <table id="reference-table"></table>
          </div>
        </article>
      </div>
    </section>

    <section id="challenge-panel" class="panel hidden">
      <div class="challenge-head">
        <div id="level-label" class="summary"></div>
        <button id="new-level" type="button">New Level</button>
      </div>
      <div class="controls">
        <label>Enter split (example: 1+3+6)
          <input id="challenge-input" type="text" autocomplete="off" />
        </label>
        <button id="add-split" type="button">Add Split</button>
        <button id="check-level" type="button">Check</button>
        <button id="reveal-missing" type="button">Reveal Missing</button>
      </div>
      <p id="challenge-message" class="message"></p>
      <article class="card">
        <h2>Your valid splits</h2>
        <ul id="submitted-list" class="partition-list"></ul>
      </article>
    </section>
  </div>
`;

const modeExplorer = byId<HTMLButtonElement>("mode-explorer");
const modeChallenge = byId<HTMLButtonElement>("mode-challenge");
const explorerPanel = byId<HTMLDivElement>("explorer-panel");
const challengePanel = byId<HTMLDivElement>("challenge-panel");

const explorerNInput = byId<HTMLInputElement>("explorer-n");
const explorerKSelect = byId<HTMLSelectElement>("explorer-k");
const explorerSummary = byId<HTMLDivElement>("explorer-summary");
const partitionCaption = byId<HTMLParagraphElement>("partition-caption");
const partitionList = byId<HTMLUListElement>("partition-list");
const referenceTable = byId<HTMLTableElement>("reference-table");

const levelLabel = byId<HTMLDivElement>("level-label");
const challengeInput = byId<HTMLInputElement>("challenge-input");
const challengeMessage = byId<HTMLParagraphElement>("challenge-message");
const submittedList = byId<HTMLUListElement>("submitted-list");
const newLevelButton = byId<HTMLButtonElement>("new-level");
const addSplitButton = byId<HTMLButtonElement>("add-split");
const checkLevelButton = byId<HTMLButtonElement>("check-level");
const revealMissingButton = byId<HTMLButtonElement>("reveal-missing");

let mode: Mode = "explorer";
let challengeLevel = createChallengeLevel();

modeExplorer.addEventListener("click", () => setMode("explorer"));
modeChallenge.addEventListener("click", () => setMode("challenge"));
explorerNInput.addEventListener("input", () => renderExplorer());
explorerKSelect.addEventListener("change", () => renderExplorer());
newLevelButton.addEventListener("click", () => {
  challengeLevel = createChallengeLevel();
  challengeInput.value = "";
  challengeMessage.textContent = "New level started.";
  renderChallenge();
});
addSplitButton.addEventListener("click", () => addChallengeSplit());
checkLevelButton.addEventListener("click", () => checkChallenge());
revealMissingButton.addEventListener("click", () => revealMissing());
challengeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addChallengeSplit();
  }
});

renderReferenceTable();
renderExplorer();
renderChallenge();
setMode("explorer");

function setMode(next: Mode): void {
  mode = next;
  const explorer = mode === "explorer";
  modeExplorer.classList.toggle("active", explorer);
  modeChallenge.classList.toggle("active", !explorer);
  explorerPanel.classList.toggle("hidden", !explorer);
  challengePanel.classList.toggle("hidden", explorer);
}

function renderExplorer(): void {
  const n = normalizeN(explorerNInput.value);
  const k = normalizeK(explorerKSelect.value);
  explorerNInput.value = String(n);
  explorerKSelect.value = String(k);

  const partitions = enumeratePartitions(n, k);
  const enumCount = partitions.length;
  const formulaCount = countByFormula(n, k);
  const match = enumCount === formulaCount;

  explorerSummary.innerHTML = `
    <strong>N = ${n}, k = ${k}</strong><br/>
    Enumeration: <strong>${enumCount}</strong> | Formula: <strong>${formulaCount}</strong> |
    <span class="${match ? "ok" : "bad"}">${match ? "MATCH" : "MISMATCH"}</span>
  `;

  const limit = 150;
  const preview = partitions.slice(0, limit).map(formatPartition);
  partitionCaption.textContent =
    partitions.length > limit
      ? `Showing first ${limit} of ${partitions.length} partitions.`
      : `Showing all ${partitions.length} partitions.`;
  partitionList.innerHTML = preview.map((text) => `<li>${text}</li>`).join("");
}

function renderReferenceTable(): void {
  const rows = buildReferenceTable(15);
  referenceTable.innerHTML = `
    <thead>
      <tr>
        <th>N</th>
        <th>1 pile</th>
        <th>2 piles</th>
        <th>3 piles</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `
            <tr>
              <td>${row.n}</td>
              <td>${row.oneCount}</td>
              <td>${row.twoCount}</td>
              <td>${row.threeCount}</td>
            </tr>`,
        )
        .join("")}
    </tbody>
  `;
}

function renderChallenge(): void {
  const total = challengeLevel.expected.size;
  const found = challengeLevel.submitted.size;
  levelLabel.innerHTML = `Find all splits for <strong>N = ${challengeLevel.n}</strong> into <strong>k = ${challengeLevel.k}</strong> piles. Found ${found}/${total}.`;
  submittedList.innerHTML = [...challengeLevel.submitted]
    .sort(sortPartitionKeys)
    .map((key) => `<li>${key.replaceAll("+", " + ")}</li>`)
    .join("");
}

function addChallengeSplit(): void {
  const raw = challengeInput.value.trim();
  const parse = parseInput(raw);
  if (!parse.ok) {
    challengeMessage.textContent = parse.error;
    return;
  }

  const parts = parse.parts;
  if (!isValidPartition(parts, challengeLevel.n, challengeLevel.k)) {
    challengeMessage.textContent = `Invalid for this level: split must have ${challengeLevel.k} positive parts summing to ${challengeLevel.n}.`;
    return;
  }

  const key = partitionKey(parts);
  if (!challengeLevel.expected.has(key)) {
    challengeMessage.textContent =
      "That split is not valid under unordered partition rules.";
    return;
  }
  if (challengeLevel.submitted.has(key)) {
    challengeMessage.textContent = "Already submitted.";
    return;
  }

  challengeLevel.submitted.add(key);
  challengeInput.value = "";
  challengeMessage.textContent = "Accepted.";
  renderChallenge();
}

function checkChallenge(): void {
  const total = challengeLevel.expected.size;
  const found = challengeLevel.submitted.size;
  if (found === total) {
    challengeMessage.textContent = "Perfect. You found all valid splits.";
    return;
  }
  challengeMessage.textContent = `Not complete yet: ${total - found} missing.`;
}

function revealMissing(): void {
  const missing = [...challengeLevel.expected]
    .filter((key) => !challengeLevel.submitted.has(key))
    .sort(sortPartitionKeys);

  if (missing.length === 0) {
    challengeMessage.textContent = "No missing splits.";
    return;
  }

  const preview = missing.slice(0, 6).map((key) => key.replaceAll("+", " + "));
  challengeMessage.textContent = `Missing (${missing.length}): ${preview.join(", ")}${missing.length > preview.length ? ", ..." : ""}`;
}

function createChallengeLevel(): ChallengeLevel {
  const k = Math.random() < 0.5 ? 2 : 3;
  const n = k === 2 ? randomInt(8, 42) : randomInt(8, 28);
  const expected = new Set(enumeratePartitions(n, k).map(partitionKey));
  return { n, k, expected, submitted: new Set<string>() };
}

function parseInput(raw: string): { ok: true; parts: Partition } | { ok: false; error: string } {
  const cleaned = raw.replace(/\s+/g, "");
  if (!/^\d+(\+\d+)*$/.test(cleaned)) {
    return { ok: false, error: 'Use positive integers joined by "+", for example 1+3+6.' };
  }

  const parts = cleaned.split("+").map((token) => Number(token));
  if (parts.some((value) => !Number.isInteger(value) || value < 1)) {
    return { ok: false, error: "All parts must be positive integers." };
  }
  return { ok: true, parts };
}

function normalizeN(raw: string): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(200, Math.max(1, Math.round(parsed)));
}

function normalizeK(raw: string): 1 | 2 | 3 {
  if (raw === "1" || raw === "2" || raw === "3") {
    return Number(raw) as 1 | 2 | 3;
  }
  return 1;
}

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Missing element with id "${id}"`);
  }
  return node as T;
}

function formatPartition(parts: Partition): string {
  return parts.join(" + ");
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sortPartitionKeys(a: string, b: string): number {
  const aNums = a.split("+").map(Number);
  const bNums = b.split("+").map(Number);
  const len = Math.min(aNums.length, bNums.length);
  for (let i = 0; i < len; i += 1) {
    if (aNums[i] !== bNums[i]) {
      return aNums[i] - bNums[i];
    }
  }
  return aNums.length - bNums.length;
}
