// Pure domain model for floorplan objects. Ported 1:1 from the original
// seating-plan.html (DEFAULTS, clamping, snapping, seat math) — no React/DOM deps.

export type ObjectType = 'round' | 'long' | 'stage' | 'door';

export interface FloorplanObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  label: string;
  capacity: number;
}

export const CANVAS_W = 1400;
export const CANVAS_H = 900;

export const DEFAULTS: Record<ObjectType, { w: number; h: number; capacity: number }> = {
  round: { w: 120, h: 120, capacity: 10 },
  long: { w: 220, h: 70, capacity: 10 },
  stage: { w: 260, h: 90, capacity: 0 },
  door: { w: 60, h: 20, capacity: 0 },
};

export const CAP_MIN = 0;
export const CAP_MAX = 30;
export const DIM_MIN = 20;
export const DIM_MAX = 600;

export function clampNum(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function isRotatableType(type: ObjectType): boolean {
  return type === 'long' || type === 'stage' || type === 'door';
}

export function isTableType(type: ObjectType): boolean {
  return type === 'round' || type === 'long';
}

export function normTable(s: string | null | undefined): string {
  return String(s || '').trim().toLowerCase();
}

/** Position of every seat dot for a round/long table, relative to the object's own top-left. */
export function seatPositions(
  type: ObjectType,
  w: number,
  h: number,
  capacity: number
): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  if (capacity <= 0) return pts;
  if (type === 'round') {
    const r = Math.min(w, h) / 2 + 10;
    for (let i = 0; i < capacity; i++) {
      const ang = (i / capacity) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: w / 2 + r * Math.cos(ang) - 3.5, y: h / 2 + r * Math.sin(ang) - 3.5 });
    }
  } else if (type === 'long') {
    const perSide = Math.ceil(capacity / 2);
    for (let i = 0; i < capacity; i++) {
      const side = i < perSide ? 0 : 1;
      const idx = side === 0 ? i : i - perSide;
      const count = side === 0 ? perSide : capacity - perSide;
      const x = count > 1 ? (idx / (count - 1)) * (w - 16) + 8 : w / 2;
      const y = side === 0 ? -10 : h + 3;
      pts.push({ x: x - 3.5, y });
    }
  }
  return pts;
}

const ROT_SNAP_DIST = 5;
export interface RotationSnapResult {
  deg: number;
  snapped: boolean;
}
export function snapRotation(deg: number): RotationSnapResult {
  const norm = ((deg % 360) + 360) % 360;
  const candidates = [0, 90, 180, 270, 360];
  let best = norm;
  let bestDiff = Infinity;
  for (const c of candidates) {
    const diff = Math.abs(norm - c);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c % 360;
    }
  }
  return bestDiff <= ROT_SNAP_DIST ? { deg: best, snapped: true } : { deg: norm, snapped: false };
}

export const SNAP_DIST = 6;

export interface SnapResult {
  x: number;
  y: number;
  guideV: number | null;
  guideH: number | null;
}

/** Snaps a dragged object's proposed top-left (x,y) to the canvas center or to other objects'
 * centers, one axis at a time (canvas-center wins over other-object centers on a given axis). */
export function findSnap(
  x: number,
  y: number,
  w: number,
  h: number,
  others: FloorplanObject[]
): SnapResult {
  const cx = x + w / 2;
  const cy = y + h / 2;
  let snappedX = x;
  let snappedY = y;
  let guideV: number | null = null;
  let guideH: number | null = null;

  const canvasCx = CANVAS_W / 2;
  const canvasCy = CANVAS_H / 2;
  if (Math.abs(cx - canvasCx) <= SNAP_DIST) {
    snappedX = canvasCx - w / 2;
    guideV = canvasCx;
  }
  if (Math.abs(cy - canvasCy) <= SNAP_DIST) {
    snappedY = canvasCy - h / 2;
    guideH = canvasCy;
  }

  if (guideV === null) {
    for (const o of others) {
      const ocx = o.x + o.w / 2;
      if (Math.abs(cx - ocx) <= SNAP_DIST) {
        snappedX = ocx - w / 2;
        guideV = ocx;
        break;
      }
    }
  }
  if (guideH === null) {
    for (const o of others) {
      const ocy = o.y + o.h / 2;
      if (Math.abs(cy - ocy) <= SNAP_DIST) {
        snappedY = ocy - h / 2;
        guideH = ocy;
        break;
      }
    }
  }

  return { x: snappedX, y: snappedY, guideV, guideH };
}

/** Rotates a resize-drag delta into the object's own (un-rotated) local coordinate space. */
export function unrotateDelta(dx: number, dy: number, rotDeg: number): { dx: number; dy: number } {
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { dx: cos * dx + sin * dy, dy: -sin * dx + cos * dy };
}

/** New width/height for a resize gesture given the un-rotated local delta. Round tables
 * resize uniformly (average of both axes); others resize width/height independently. */
export function applyResizeDelta(
  type: ObjectType,
  w0: number,
  h0: number,
  dxLocal: number,
  dyLocal: number
): { w: number; h: number } {
  if (type === 'round') {
    const size = clampNum(w0 + (dxLocal + dyLocal) / 2, DIM_MIN, DIM_MAX);
    return { w: size, h: size };
  }
  return {
    w: clampNum(w0 + dxLocal, DIM_MIN, DIM_MAX),
    h: clampNum(h0 + dyLocal, DIM_MIN, DIM_MAX),
  };
}

export function formatTableLabel(table: string, tableWordPrefix: string): string {
  const s = String(table || '').trim();
  return s.toLowerCase().startsWith(tableWordPrefix.toLowerCase()) ? s : `${tableWordPrefix} ${s}`;
}

export const LABEL_PREFIX_KEY: Record<ObjectType, string> = {
  round: 'labelPrefixRound',
  long: 'labelPrefixLong',
  stage: 'labelPrefixStage',
  door: 'labelPrefixDoor',
};

export const OBJECT_TYPE_DEFS: Array<{ type: ObjectType; labelKey: string }> = [
  { type: 'round', labelKey: 'objTypeRound' },
  { type: 'long', labelKey: 'objTypeLong' },
  { type: 'stage', labelKey: 'objTypeStage' },
  { type: 'door', labelKey: 'objTypeDoor' },
];

/** Mirrors the original's atan2-based rotate-gesture math: angle from object center to
 * pointer, offset so 0deg points "up", then run through snapRotation. */
export function rotationFromPointer(cx: number, cy: number, px: number, py: number): RotationSnapResult {
  const dx = px - cx;
  const dy = py - cy;
  const raw = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
  return snapRotation(raw);
}

/** `stage`/`door` get a bare translated label; `round`/`long` get "<prefix> <n>" where n is a
 * running count of existing objects of that type + 1 (matches the original's numbering). */
export function defaultObjectLabel(
  type: ObjectType,
  existing: FloorplanObject[],
  translatePrefix: (key: string) => string
): string {
  const prefix = translatePrefix(LABEL_PREFIX_KEY[type]);
  if (type === 'stage' || type === 'door') return prefix;
  const n = existing.filter((o) => o.type === type).length + 1;
  return `${prefix} ${n}`;
}
