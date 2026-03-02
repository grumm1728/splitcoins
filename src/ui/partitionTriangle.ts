import type { PartitionPoint } from "../domain/partitionSpace";
import type { Parts3 } from "../domain/splitMath";
import {
  orderedLatticePoints,
  partsToSvg,
  type DragPosition,
  type OrderedLatticePoint,
} from "./rungState";

type PartitionTriangleCallbacks = {
  onDragMove: (position: DragPosition) => void;
  onDragEnd: (position: DragPosition) => void;
};

export type PartitionTriangleState = {
  n: number;
  points: PartitionPoint[];
  selectedKey: string | null;
  dragPosition: DragPosition | null;
  isDragging: boolean;
};

type PartitionTriangleDom = {
  signature: string;
  svg: SVGSVGElement;
  forceLayer: SVGGElement;
  markerAura: SVGCircleElement;
  marker: SVGCircleElement;
  guideLayer: SVGGElement;
  edgeLabelA: SVGTextElement;
  edgeLabelB: SVGTextElement;
  edgeLabelC: SVGTextElement;
  detail: HTMLParagraphElement;
  splitReadout: HTMLParagraphElement;
  legend: HTMLParagraphElement;
  coins: HTMLDivElement;
  handleA: HTMLSpanElement;
  handleB: HTMLSpanElement;
  diagramReadout: HTMLParagraphElement;
  coinEls: HTMLSpanElement[];
  latticeNodes: Map<string, SVGCircleElement>;
  latticeUnorderedKeys: Map<string, string>;
  orderedPoints: OrderedLatticePoint[];
  multiplicityByKey: Map<string, 1 | 3 | 6>;
  state: PartitionTriangleState;
  callbacks: PartitionTriangleCallbacks;
};

const triangles = new WeakMap<HTMLElement, PartitionTriangleDom>();

export function renderPartitionTriangle(
  container: HTMLElement,
  state: PartitionTriangleState,
  callbacks: PartitionTriangleCallbacks,
): void {
  const signature = `${state.n}:${state.points.map((point) => point.key).join(",")}`;
  let dom = triangles.get(container);
  if (!dom || dom.signature !== signature) {
    dom = buildPartitionTriangle(container, state, callbacks, signature);
    triangles.set(container, dom);
  }

  dom.state = state;
  dom.callbacks = callbacks;
  if (dom.coinEls.length !== state.n) {
    syncCoins(dom, state.n);
  }
  updateTriangle(dom);
}

function buildPartitionTriangle(
  container: HTMLElement,
  state: PartitionTriangleState,
  callbacks: PartitionTriangleCallbacks,
  signature: string,
): PartitionTriangleDom {
  container.innerHTML = `
    <article class="card rung">
      <h2>Rung 2: Drag Through Partition Space</h2>
      <p>Drag the blue point and release on any ordered lattice point. It will snap back to the sorted home region.</p>
      <svg class="triangle triangle-solo" viewBox="0 0 400 360" role="img" aria-label="Partition triangle">
        <polygon points="20,340 380,340 200,28" class="tri-outline"></polygon>
        <g id="tri-ticks"></g>
        <g id="tri-lattice"></g>
        <g id="tri-force"></g>
        <g id="tri-guides"></g>
        <circle id="tri-aura" class="tri-marker-aura" r="18"></circle>
        <circle id="tri-marker" class="tri-marker" r="9" tabindex="0"></circle>
        <g id="tri-edge-labels" class="tri-edge-labels">
          <text id="tri-label-a"></text>
          <text id="tri-label-b"></text>
          <text id="tri-label-c"></text>
        </g>
      </svg>
      <div class="coin-track coin-track-readonly" id="triangle-track">
        <div class="coins" id="triangle-coins"></div>
        <span id="triangle-handle-a" class="handle handle-static handle-muted" aria-hidden="true"></span>
        <span id="triangle-handle-b" class="handle handle-static handle-muted" aria-hidden="true"></span>
      </div>
      <p id="triangle-diagram-readout" class="split-readout"></p>
      <p id="tri-detail" class="partition-detail"></p>
      <p id="tri-split" class="split-readout"></p>
      <p id="tri-legend" class="triangle-legend"></p>
    </article>
  `;

  const svg = byId<SVGSVGElement>(container, ".triangle");
  const forceLayer = byId<SVGGElement>(container, "#tri-force");
  const markerAura = byId<SVGCircleElement>(container, "#tri-aura");
  const marker = byId<SVGCircleElement>(container, "#tri-marker");
  const tickLayer = byId<SVGGElement>(container, "#tri-ticks");
  const latticeLayer = byId<SVGGElement>(container, "#tri-lattice");
  const guideLayer = byId<SVGGElement>(container, "#tri-guides");
  const edgeLabelA = byId<SVGTextElement>(container, "#tri-label-a");
  const edgeLabelB = byId<SVGTextElement>(container, "#tri-label-b");
  const edgeLabelC = byId<SVGTextElement>(container, "#tri-label-c");
  const detail = byId<HTMLParagraphElement>(container, "#tri-detail");
  const splitReadout = byId<HTMLParagraphElement>(container, "#tri-split");
  const legend = byId<HTMLParagraphElement>(container, "#tri-legend");
  const coins = byId<HTMLDivElement>(container, "#triangle-coins");
  const handleA = byId<HTMLSpanElement>(container, "#triangle-handle-a");
  const handleB = byId<HTMLSpanElement>(container, "#triangle-handle-b");
  const diagramReadout = byId<HTMLParagraphElement>(container, "#triangle-diagram-readout");
  const latticeNodes = new Map<string, SVGCircleElement>();
  const latticeUnorderedKeys = new Map<string, string>();
  const orderedPoints = orderedLatticePoints(state.n);
  const multiplicityByKey = new Map(state.points.map((point) => [point.key, point.multiplicity]));

  buildTicks(tickLayer);

  for (const point of orderedPoints) {
    const unorderedKey = sortedKey(point.parts);
    const isSortedHome = unorderedKey === point.id.replaceAll("|", "+");
    const multiplicity = multiplicityByKey.get(unorderedKey) ?? 1;
    const node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    node.setAttribute("cx", String(point.x));
    node.setAttribute("cy", String(point.y));
    node.setAttribute("r", String(isSortedHome ? radiusForMultiplicity(multiplicity) : 2.8));
    node.setAttribute("class", `tri-lattice-point${isSortedHome ? " sorted-home" : ""}`);
    node.dataset.id = point.id;
    node.dataset.unorderedKey = unorderedKey;
    latticeLayer.appendChild(node);
    latticeNodes.set(point.id, node);
    latticeUnorderedKeys.set(point.id, unorderedKey);
  }

  const dom: PartitionTriangleDom = {
    signature,
    svg,
    forceLayer,
    markerAura,
    marker,
    guideLayer,
    edgeLabelA,
    edgeLabelB,
    edgeLabelC,
    detail,
    splitReadout,
    legend,
    coins,
    handleA,
    handleB,
    diagramReadout,
    coinEls: [],
    latticeNodes,
    latticeUnorderedKeys,
    orderedPoints,
    multiplicityByKey,
    state,
    callbacks,
  };

  syncCoins(dom, state.n);
  attachDrag(marker, dom);
  marker.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    marker.blur();
  });

  return dom;
}

function updateTriangle(dom: PartitionTriangleDom): void {
  const selectedParts = parseSelectedParts(dom.state.selectedKey);
  const sortedPosition = selectedParts ? partsToSvg(selectedParts, dom.state.n) : { x: 200, y: 340 };
  const markerPosition = dom.state.dragPosition ?? sortedPosition;
  const referencePoint = nearestByDistance(dom.orderedPoints, markerPosition);
  const referenceSortedParts = referencePoint ? normalizeParts(referencePoint.parts) : null;
  const referenceSortedPosition = referenceSortedParts ? partsToSvg(referenceSortedParts, dom.state.n) : null;
  const showForcePreview = dom.state.isDragging && referencePoint !== null && referenceSortedPosition !== null;
  const displayParts = dom.state.isDragging ? referencePoint?.parts ?? selectedParts : selectedParts;
  const selectedId = selectedParts?.join("|") ?? null;
  const nearestId = dom.state.isDragging ? referencePoint?.id ?? null : null;
  const nearestKey = referencePoint ? sortedKey(referencePoint.parts) : null;

  dom.markerAura.setAttribute("cx", String(markerPosition.x));
  dom.markerAura.setAttribute("cy", String(markerPosition.y));
  dom.marker.setAttribute("cx", String(markerPosition.x));
  dom.marker.setAttribute("cy", String(markerPosition.y));
  dom.marker.classList.toggle("dragging", dom.state.isDragging);
  dom.markerAura.classList.toggle("dragging", dom.state.isDragging);

  for (const point of dom.orderedPoints) {
    const node = dom.latticeNodes.get(point.id);
    if (!node) {
      continue;
    }
    const pointKey = dom.latticeUnorderedKeys.get(point.id) ?? null;
    node.classList.toggle("selected", !dom.state.isDragging && point.id === selectedId);
    node.classList.toggle("nearest", point.id === nearestId);
    node.classList.toggle(
      "related",
      dom.state.isDragging
      && nearestKey !== null
      && pointKey === nearestKey
      && point.id !== nearestId,
    );
  }

  if (showForcePreview && referencePoint && referenceSortedPosition) {
    renderForcePreview(dom.forceLayer, markerPosition, referenceSortedPosition);
  } else {
    clearForcePreview(dom.forceLayer);
  }

  dom.guideLayer.replaceChildren();

  if (dom.state.isDragging) {
    const projections = buildPerpendicularGuides(markerPosition);
    for (const guide of projections.guides) {
      dom.guideLayer.appendChild(guide);
    }
    const labelValues = displayParts ?? [0, 0, 0];
    setEdgeLabel(dom.edgeLabelA, projections.labels.a, String(labelValues[0]));
    setEdgeLabel(dom.edgeLabelB, projections.labels.b, String(labelValues[1]));
    setEdgeLabel(dom.edgeLabelC, projections.labels.c, String(labelValues[2]));
  } else {
    clearEdgeLabel(dom.edgeLabelA);
    clearEdgeLabel(dom.edgeLabelB);
    clearEdgeLabel(dom.edgeLabelC);
  }

  updateSplitDiagram(dom, displayParts);

  if (!selectedParts) {
    dom.detail.textContent = dom.state.isDragging && referencePoint
      ? `Dragging over ordering ${referencePoint.parts.join(" + ")}`
      : "No valid partition selected yet.";
    dom.splitReadout.textContent = dom.state.isDragging && referenceSortedParts
      ? `Falls to sorted home: ${referenceSortedParts.join(" | ")}`
      : "Release on any ordered lattice point to snap back to its sorted home.";
    dom.legend.textContent = "Blue marks the snap target. Gold marks its reordered siblings. Larger dots mark sorted home points only.";
    return;
  }

  dom.detail.textContent = dom.state.isDragging && referencePoint
    ? `Ordering under pointer: ${referencePoint.parts.join(" | ")}`
    : `Current sorted partition: ${selectedParts.join(" + ")}`;
  dom.splitReadout.innerHTML = dom.state.isDragging && referenceSortedParts
    ? `Falls to sorted home: <strong>${referenceSortedParts.join(" | ")}</strong>`
    : `Representative split shown: <strong>${selectedParts.join(" | ")}</strong>`;
  dom.legend.textContent = "Blue marks the snap target. Gold marks its reordered siblings. Larger dots mark sorted home points only.";
}

function updateSplitDiagram(dom: PartitionTriangleDom, parts: Parts3 | null): void {
  const n = dom.state.n;
  const cutA = parts ? parts[0] : 0;
  const cutB = parts ? parts[0] + parts[1] : 0;
  const left = dividerPositionPercent(cutA, n);
  const right = dividerPositionPercent(cutB, n);

  dom.handleA.style.left = `${left}%`;
  dom.handleB.style.left = `${right}%`;

  dom.coinEls.forEach((coin, index) => {
    const position = index + 1;
    const group = parts
      ? position <= cutA ? "g1" : position <= cutB ? "g2" : "g3"
      : "g3";
    coin.className = `coin ${group}`;
  });

  dom.diagramReadout.innerHTML = parts
    ? `Diagram split: <strong>${parts[0]} | ${parts[1]} | ${parts[2]}</strong>`
    : "Release on a lattice point to preview a split.";
}

function syncCoins(dom: PartitionTriangleDom, n: number): void {
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

function buildTicks(layer: SVGGElement): void {
  const ticks = [
    ...edgeTicks([20, 340], [380, 340], [0, -7]),
    ...edgeTicks([20, 340], [200, 28], [6, 3.5]),
    ...edgeTicks([380, 340], [200, 28], [-6, 3.5]),
  ];

  for (const tick of ticks) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(tick.x1));
    line.setAttribute("y1", String(tick.y1));
    line.setAttribute("x2", String(tick.x2));
    line.setAttribute("y2", String(tick.y2));
    line.setAttribute("class", "tri-tick");
    layer.appendChild(line);
  }
}

function edgeTicks(
  start: [number, number],
  end: [number, number],
  normal: [number, number],
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const ticks: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let step = 1; step <= 8; step += 1) {
    const t = step / 9;
    const x = lerp(start[0], end[0], t);
    const y = lerp(start[1], end[1], t);
    ticks.push({
      x1: x,
      y1: y,
      x2: x + normal[0],
      y2: y + normal[1],
    });
  }
  return ticks;
}

function buildPerpendicularGuides(position: DragPosition): {
  guides: SVGLineElement[];
  labels: {
    a: DragPosition;
    b: DragPosition;
    c: DragPosition;
  };
} {
  const bottom = projectToLine(position, { x: 20, y: 340 }, { x: 380, y: 340 });
  const left = projectToLine(position, { x: 20, y: 340 }, { x: 200, y: 28 });
  const right = projectToLine(position, { x: 380, y: 340 }, { x: 200, y: 28 });

  return {
    guides: [
      guideLine(position, bottom),
      guideLine(position, left),
      guideLine(position, right),
    ],
    labels: {
      a: { x: left.x - 18, y: left.y - 4 },
      b: { x: right.x + 10, y: right.y - 4 },
      c: { x: bottom.x, y: bottom.y + 18 },
    },
  };
}

function projectToLine(position: DragPosition, start: DragPosition, end: DragPosition): DragPosition {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = (dx * dx) + (dy * dy);
  if (lengthSq === 0) {
    return start;
  }
  const t = ((position.x - start.x) * dx + (position.y - start.y) * dy) / lengthSq;
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: start.x + (dx * clampedT),
    y: start.y + (dy * clampedT),
  };
}

function guideLine(from: DragPosition, to: DragPosition): SVGLineElement {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(from.x));
  line.setAttribute("y1", String(from.y));
  line.setAttribute("x2", String(to.x));
  line.setAttribute("y2", String(to.y));
  line.setAttribute("class", "tri-guide");
  return line;
}

function setEdgeLabel(node: SVGTextElement, position: DragPosition, value: string): void {
  node.setAttribute("x", String(position.x));
  node.setAttribute("y", String(position.y));
  node.textContent = value;
  node.style.display = "block";
}

function clearEdgeLabel(node: SVGTextElement): void {
  node.textContent = "";
  node.style.display = "none";
}

function renderForcePreview(
  forceLayer: SVGGElement,
  dragPosition: DragPosition,
  sortedHomePosition: DragPosition,
): void {
  forceLayer.replaceChildren();

  const dx = sortedHomePosition.x - dragPosition.x;
  const dy = sortedHomePosition.y - dragPosition.y;
  const distance = Math.hypot(dx, dy);

  const basinOuter = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  basinOuter.setAttribute("cx", String(sortedHomePosition.x));
  basinOuter.setAttribute("cy", String(sortedHomePosition.y));
  basinOuter.setAttribute("r", "12");
  basinOuter.setAttribute("class", "tri-force-basin outer");
  forceLayer.appendChild(basinOuter);

  const basinInner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  basinInner.setAttribute("cx", String(sortedHomePosition.x));
  basinInner.setAttribute("cy", String(sortedHomePosition.y));
  basinInner.setAttribute("r", "7");
  basinInner.setAttribute("class", "tri-force-basin inner");
  forceLayer.appendChild(basinInner);

  if (distance < 10) {
    return;
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", forcePathD(dragPosition, sortedHomePosition));
  path.setAttribute("class", "tri-force-path");
  forceLayer.appendChild(path);
}

function clearForcePreview(forceLayer: SVGGElement): void {
  forceLayer.replaceChildren();
}

function forcePathD(from: DragPosition, to: DragPosition): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const sag = Math.max(10, Math.min(32, Math.hypot(to.x - from.x, to.y - from.y) * 0.16));
  const controlX = midX;
  const controlY = midY + sag;
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

function nearestByDistance(points: OrderedLatticePoint[], position: DragPosition): OrderedLatticePoint | null {
  let best: OrderedLatticePoint | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const point of points) {
    const distance = Math.hypot(point.x - position.x, point.y - position.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = point;
    }
  }
  return best;
}

function parseSelectedParts(key: string | null): Parts3 | null {
  if (!key) {
    return null;
  }
  const values = key.split("+").map((value) => Number(value));
  if (values.length !== 3 || values.some((value) => !Number.isInteger(value) || value < 1)) {
    return null;
  }
  return [values[0], values[1], values[2]];
}

function sortedKey(parts: Parts3): string {
  return [...parts].sort((left, right) => left - right).join("+");
}

function normalizeParts(parts: Parts3): Parts3 {
  const sorted = [...parts].sort((left, right) => left - right);
  return [sorted[0], sorted[1], sorted[2]];
}

function radiusForMultiplicity(multiplicity: 1 | 3 | 6): number {
  if (multiplicity === 1) {
    return 4.4;
  }
  if (multiplicity === 3) {
    return 5.6;
  }
  return 6.8;
}

function attachDrag(marker: SVGCircleElement, dom: PartitionTriangleDom): void {
  marker.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    marker.setPointerCapture(event.pointerId);
    const move = (clientX: number, clientY: number) => {
      dom.callbacks.onDragMove(clientToSvg(dom.svg, clientX, clientY));
    };

    move(event.clientX, event.clientY);

    const finish = (clientX: number, clientY: number) => {
      if (marker.hasPointerCapture(event.pointerId)) {
        marker.releasePointerCapture(event.pointerId);
      }
      marker.removeEventListener("pointermove", onMove);
      marker.removeEventListener("pointerup", onUp);
      marker.removeEventListener("pointercancel", onCancel);
      dom.callbacks.onDragEnd(clientToSvg(dom.svg, clientX, clientY));
    };

    const onMove = (pointerMove: PointerEvent) => {
      move(pointerMove.clientX, pointerMove.clientY);
    };
    const onUp = (pointerUp: PointerEvent) => {
      finish(pointerUp.clientX, pointerUp.clientY);
    };
    const onCancel = () => {
      const currentX = Number(marker.getAttribute("cx") ?? "200");
      const currentY = Number(marker.getAttribute("cy") ?? "340");
      finish(currentX, currentY);
    };

    marker.addEventListener("pointermove", onMove);
    marker.addEventListener("pointerup", onUp);
    marker.addEventListener("pointercancel", onCancel);
  });
}

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): DragPosition {
  const rect = svg.getBoundingClientRect();
  const xRatio = (clientX - rect.left) / Math.max(1, rect.width);
  const yRatio = (clientY - rect.top) / Math.max(1, rect.height);
  return {
    x: xRatio * 400,
    y: yRatio * 360,
  };
}

function byId<T extends Element>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element ${selector}`);
  }
  return element;
}

function lerp(start: number, end: number, t: number): number {
  return start + ((end - start) * t);
}

function dividerPositionPercent(cut: number, n: number): number {
  if (n < 1) {
    return 0;
  }
  return ((cut + 0.5) / (n + 1)) * 100;
}
