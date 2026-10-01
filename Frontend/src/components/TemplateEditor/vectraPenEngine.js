// Vectra Pen Tool Engine — Exact port from D:\SVG_Editor\js

const DRAG_THRESHOLD = 5; // px screen space before a drag registers
const HIT_TOLERANCE = 14; // px in screen space for magnetic snapping

let _id = 1;
export const uid = () => 'n' + (_id++).toString(36);

export function makeNode(x, y, type = 'corner') {
  return { id: uid(), x, y, in: null, out: null, type };
}

export function makePath(opts = {}) {
  return {
    id: 'vpath-' + Math.random().toString(36).substr(2, 9),
    nodes: [],
    closed: false,
    stroke: '#000000',
    strokeWidth: 2,
    fill: 'none',
    groupId: null,
    ...opts,
  };
}

export const r2 = (n) => Math.round(n * 100) / 100;
export const len = (v) => Math.hypot(v.x, v.y);
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const scale = (v, s) => ({ x: v.x * s, y: v.y * s });
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function normalize(v) {
  const l = len(v);
  return l < 1e-9 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
}

export const absIn = (n) => (n.in ? { x: n.x + n.in.x, y: n.y + n.in.y } : { x: n.x, y: n.y });
export const absOut = (n) => (n.out ? { x: n.x + n.out.x, y: n.y + n.out.y } : { x: n.x, y: n.y });

export const segmentIsLine = (a, b) => !a.out && !b.in;

export function pathToD(path) {
  if (!path || !path.nodes || path.nodes.length === 0) return '';
  const n = path.nodes.length;
  const first = path.nodes[0];
  let d = `M ${r2(first.x)} ${r2(first.y)}`;
  const count = path.closed ? n : Math.max(0, n - 1);
  for (let i = 0; i < count; i++) {
    const a = path.nodes[i];
    const b = path.nodes[(i + 1) % n];
    if (segmentIsLine(a, b)) {
      d += ` L ${r2(b.x)} ${r2(b.y)}`;
    } else {
      const c1 = absOut(a), c2 = absIn(b);
      d += ` C ${r2(c1.x)} ${r2(c1.y)} ${r2(c2.x)} ${r2(c2.y)} ${r2(b.x)} ${r2(b.y)}`;
    }
  }
  if (path.closed) d += ' Z';
  return d;
}

export function pathToDCombo(paths) {
  if (!paths) return '';
  const pathArray = Array.isArray(paths)
    ? paths
    : (paths instanceof Map ? Array.from(paths.values()) : [paths]);

  const seenEdges = new Set();
  const dStrings = [];

  for (const path of pathArray) {
    if (!path || !path.nodes || path.nodes.length === 0) continue;
    const n = path.nodes.length;
    const first = path.nodes[0];
    let d = `M ${r2(first.x)} ${r2(first.y)}`;
    const count = path.closed ? n : Math.max(0, n - 1);

    for (let i = 0; i < count; i++) {
      const a = path.nodes[i];
      const b = path.nodes[(i + 1) % n];
      const x1 = Math.round(a.x * 100) / 100, y1 = Math.round(a.y * 100) / 100;
      const x2 = Math.round(b.x * 100) / 100, y2 = Math.round(b.y * 100) / 100;

      if (segmentIsLine(a, b)) {
        const edgeKey = x1 < x2 || (x1 === x2 && y1 < y2)
          ? `${x1},${y1}_${x2},${y2}`
          : `${x2},${y2}_${x1},${y1}`;

        if (seenEdges.has(edgeKey)) {
          // Skip duplicate line segment between the exact same two points
          d += ` M ${r2(b.x)} ${r2(b.y)}`;
          continue;
        }
        seenEdges.add(edgeKey);
        d += ` L ${r2(b.x)} ${r2(b.y)}`;
      } else {
        const c1 = absOut(a), c2 = absIn(b);
        d += ` C ${r2(c1.x)} ${r2(c1.y)} ${r2(c2.x)} ${r2(c2.y)} ${r2(b.x)} ${r2(b.y)}`;
      }
    }
    if (path.closed) d += ' Z';
    dStrings.push(d);
  }

  return dStrings.join(' ');
}

export function setHandle(node, end, v, { breakSymmetry = false } = {}) {
  node[end] = v;
  if (breakSymmetry) { node.type = 'cusp'; return; }
  const other = end === 'in' ? 'out' : 'in';
  if (node.type === 'symmetric') {
    node[other] = scale(v, -1);
  } else if (node.type === 'smooth' && node[other]) {
    const l = len(node[other]);
    const d = normalize(v);
    node[other] = scale(d, -l);
  }
}

export function reversePath(path) {
  path.nodes.reverse();
  for (const n of path.nodes) {
    const t = n.in; n.in = n.out; n.out = t;
  }
}

export function constrainAngle(v) {
  const a = Math.atan2(v.y, v.x);
  const snapped = Math.round(a / (Math.PI / 4)) * (Math.PI / 4);
  const l = len(v);
  return { x: Math.cos(snapped) * l, y: Math.sin(snapped) * l };
}

// Class to manage Pen Tool session and rendering
export class VectraPenSession {
  constructor(options = {}) {
    this.paths = new Map(); // pathId -> path
    this.activePathId = null;
    this.drag = null;
    this.lastDown = null;
    this.ui = {
      previewD: null,
      endpointHint: null,
      ghost: null,
      guides: [],
    };
    this.cursor = 'cur-pen';
    this.scale = options.scale || 1;
    this.gridEnabled = options.gridEnabled ?? false;
    this.gridSize = options.gridSize || 24;
    this.snapEnabled = options.snapEnabled ?? true;
    this.onUpdate = options.onUpdate || (() => {});
  }

  getActivePath() {
    return this.activePathId ? this.paths.get(this.activePathId) : null;
  }

  snapPoint(pt, e) {
    const tol = HIT_TOLERANCE / this.scale;
    const disabled = e?.altKey || !this.snapEnabled;
    if (disabled) return { x: pt.x, y: pt.y, snapped: false, kind: null, guides: [] };

    // Snap to existing anchor nodes
    let bestDist = tol;
    let snappedPt = null;
    let kind = null;
    const guides = [];

    for (const path of this.paths.values()) {
      for (const node of path.nodes) {
        const d = dist(pt, node);
        if (d < bestDist) {
          bestDist = d;
          snappedPt = { x: node.x, y: node.y };
          kind = 'anchor';
        }
      }
    }

    if (snappedPt) {
      return { x: snappedPt.x, y: snappedPt.y, snapped: true, kind, guides };
    }

    // Snap to grid
    if (this.gridEnabled && this.gridSize > 0) {
      const gx = Math.round(pt.x / this.gridSize) * this.gridSize;
      const gy = Math.round(pt.y / this.gridSize) * this.gridSize;
      if (dist(pt, { x: gx, y: gy }) <= tol) {
        return { x: gx, y: gy, snapped: true, kind: 'grid', guides: [] };
      }
    }

    return { x: pt.x, y: pt.y, snapped: false, kind: null, guides: [] };
  }

  hitTest(pt) {
    const tol = HIT_TOLERANCE / this.scale;
    let bestAnchor = null;

    for (const path of this.paths.values()) {
      for (let idx = 0; idx < path.nodes.length; idx++) {
        const node = path.nodes[idx];
        const d = dist(pt, node);
        if (d <= tol && (!bestAnchor || d < bestAnchor.d)) {
          bestAnchor = { type: 'anchor', pathId: path.id, nodeId: node.id, index: idx, d };
        }
      }
    }

    return bestAnchor;
  }

  onHover(e, world) {
    const path = this.getActivePath();
    const snap = this.snapPoint(world, e);
    const target = { x: snap.x, y: snap.y };
    const hit = this.hitTest(world);

    let cursor = snap.snapped && snap.kind !== 'grid' ? 'cur-snap' : 'cur-pen';
    this.ui.endpointHint = null;

    if (hit?.type === 'anchor') {
      const hPath = this.paths.get(hit.pathId);
      if (hPath) {
        const node = hPath.nodes[hit.index];
        if (path && !path.closed && path.nodes.length >= 2) {
          cursor = 'cur-pen-close';
          this.ui.endpointHint = { x: node.x, y: node.y };
          target.x = node.x;
          target.y = node.y;
        } else if ((!path || path.closed) && !hPath.closed && (hit.index === 0 || hit.index === hPath.nodes.length - 1)) {
          cursor = 'cur-pen-extend';
          this.ui.endpointHint = { x: node.x, y: node.y };
        }
      }
    }

    // Live rubber-band preview segment from the last placed anchor
    if (path && path.nodes.length > 0 && !path.closed) {
      const last = path.nodes[path.nodes.length - 1];
      const c1 = absOut(last);
      this.ui.previewD = `M ${r2(last.x)} ${r2(last.y)} C ${r2(c1.x)} ${r2(c1.y)} ${r2(target.x)} ${r2(target.y)} ${r2(target.x)} ${r2(target.y)}`;
    } else {
      this.ui.previewD = null;
    }

    this.ui.ghost = snap.snapped ? { x: snap.x, y: snap.y, kind: snap.kind } : null;
    this.ui.guides = snap.guides || [];
    this.cursor = cursor;

    this.onUpdate();
  }

  onDown(e, world) {
    if (e.button !== 0) return;
    const now = performance.now();
    if (this.lastDown && now - this.lastDown.t < 250 && Math.hypot(e.clientX - this.lastDown.x, e.clientY - this.lastDown.y) < 4) return;
    this.lastDown = { t: now, x: e.clientX, y: e.clientY };

    const path = this.getActivePath();
    const hit = this.hitTest(world);


    // Alt/Option: delete clicked anchor node
    if (e.altKey && hit?.type === 'anchor') {
      const p = this.paths.get(hit.pathId);
      if (p && p.nodes.length > 0) {
        p.nodes.splice(hit.index, 1);
        if (p.nodes.length <= 1) {
          this.paths.delete(p.id);
          if (this.activePathId === p.id) this.activePathId = null;
        }
        this.onUpdate();
        return;
      }
    }

    const snap = this.snapPoint(world, e);
    const pt = { x: snap.x, y: snap.y };

    // Close active path if clicking its start anchor node
    if (path && !path.closed && hit?.type === 'anchor' && hit.pathId === path.id && hit.index === 0 && path.nodes.length >= 2) {
      this.drag = { mode: 'close', pathId: path.id, startWorld: world, moved: false };
      path.closed = true;
      this.finishPath();
      return;
    }

    // Extend an existing open path endpoint when clicking it
    if (!path && hit?.type === 'anchor') {
      const p = this.paths.get(hit.pathId);
      if (p && !p.closed && (hit.index === 0 || hit.index === p.nodes.length - 1)) {
        if (hit.index === 0 && p.nodes.length > 1) reversePath(p);
        this.activePathId = p.id;
        this.drag = { mode: 'extend-arm', pathId: p.id, startWorld: world, moved: false };
        this.onUpdate();
        return;
      }
    }

    // Place a new anchor node
    if (!path || path.closed) {
      const newPath = makePath();
      const node = makeNode(pt.x, pt.y, 'corner');
      newPath.nodes.push(node);
      this.paths.set(newPath.id, newPath);
      this.activePathId = newPath.id;
      this.drag = {
        mode: 'place', pathId: newPath.id, nodeId: node.id,
        startWorld: world, moved: false,
      };
    } else {
      const last = path.nodes[path.nodes.length - 1];
      if (dist(last, pt) < 3 / this.scale) {
        this.finishPath();
        return;
      }
      const node = makeNode(pt.x, pt.y, 'corner');
      path.nodes.push(node);
      this.drag = { mode: 'place', pathId: path.id, nodeId: node.id, startWorld: world, moved: false };

      if (hit?.type === 'anchor' && hit.pathId !== path.id) {
        // Connect to existing anchor node and finish active segment
        this.finishPath();
        return;
      }
    }

    this.ui.previewD = null;
    this.onUpdate();
  }

  onDrag(e, world) {
    if (!this.drag) return;
    const path = this.paths.get(this.drag.pathId);
    if (!path) { this.drag = null; return; }

    const movedPx = dist(world, this.drag.startWorld) * this.scale;
    if (!this.drag.moved && movedPx < DRAG_THRESHOLD) return;
    this.drag.moved = true;

    if (this.drag.mode === 'temp-move-node') {
      const node = path.nodes.find(n => n.id === this.drag.nodeId);
      if (!node) return;
      const snapInput = {
        x: this.drag.nodeStart.x + (world.x - this.drag.startWorld.x),
        y: this.drag.nodeStart.y + (world.y - this.drag.startWorld.y)
      };
      const snap = this.snapPoint(snapInput, e);
      node.x = snap.snapped ? snap.x : snapInput.x;
      node.y = snap.snapped ? snap.y : snapInput.y;
      this.ui.ghost = snap.snapped ? { x: snap.x, y: snap.y, kind: snap.kind } : null;
      this.onUpdate();
      return;
    }

    let v = sub(world, this.drag.startWorld);
    if (e.shiftKey) v = constrainAngle(v);

    if (this.drag.mode === 'place') {
      const node = path.nodes.find(n => n.id === this.drag.nodeId);
      if (!node) return;
      if (e.altKey) {
        node.type = 'cusp';
        node.out = v;
      } else {
        node.type = 'symmetric';
        setHandle(node, 'out', v);
      }
    } else if (this.drag.mode === 'close' || this.drag.mode === 'extend-arm') {
      const node = this.drag.mode === 'close' ? path.nodes[0] : path.nodes[path.nodes.length - 1];
      if (node.type === 'corner') node.type = 'symmetric';
      if (e.altKey) { node.type = 'cusp'; node.out = v; }
      else setHandle(node, 'out', v);
    }

    this.onUpdate();
  }

  onUp() {
    this.drag = null;
    this.onUpdate();
  }

  onKey(e) {
    const path = this.getActivePath();
    if (e.key === 'Escape' || e.key === 'Enter') {
      this.drag = null;
      this.finishPath();
      return true;
    }
    if (e.key === 'Backspace' && path) {
      this.removeLastNode(path);
      return true;
    }
    return false;
  }

  removeLastNode(path) {
    if (path.nodes.length <= 1) {
      this.paths.delete(path.id);
      this.activePathId = null;
      this.ui.previewD = null;
    } else {
      path.nodes.pop();
    }
    this.onUpdate();
  }

  finishPath() {
    const path = this.getActivePath();
    if (path && path.nodes.length <= 1) {
      this.paths.delete(path.id);
    }
    this.activePathId = null;
    this.ui.previewD = null;
    this.ui.endpointHint = null;
    this.onUpdate();
    return path;
  }

  getAllPaths() {
    return Array.from(this.paths.values());
  }

  reset() {
    this.paths.clear();
    this.activePathId = null;
    this.drag = null;
    this.ui = { previewD: null, endpointHint: null, ghost: null, guides: [] };
    this.cursor = 'cur-pen';
    this.onUpdate();
  }
}
