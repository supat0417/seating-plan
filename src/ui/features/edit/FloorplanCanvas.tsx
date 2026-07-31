import { useCallback, useEffect, useRef } from 'react';
import {
  CANVAS_H, CANVAS_W, applyResizeDelta, findSnap, isRotatableType, isTableType,
  rotationFromPointer, seatPositions, unrotateDelta, type FloorplanObject,
} from '../../../domain/floorplan';
import { useT } from '../../i18n/I18nContext';

interface DragState {
  primaryId: string;
  ids: string[];
  initial: Record<string, { x: number; y: number }>;
  startPx: number;
  startPy: number;
  dragged: boolean;
}
interface ResizeState { id: string; startX: number; startY: number; w0: number; h0: number; rot0: number; changed: boolean }
interface RotateState { id: string; changed: boolean }
interface MarqueeState { startX: number; startY: number; dragged: boolean }

export interface FloorplanCanvasProps {
  floorplan: FloorplanObject[];
  selectedIds: string[];
  zoom: number;
  readOnly: boolean;
  matchedId?: string | null;
  onSelect?: (ids: string[]) => void;
  onCommitMove?: (changes: Array<{ id: string; x: number; y: number }>) => void;
  onCommitResize?: (id: string, w: number, h: number) => void;
  onCommitRotate?: (id: string, rot: number) => void;
  onDropNewObject?: (type: FloorplanObject['type'], x: number, y: number) => void;
  onOpenTable?: (obj: FloorplanObject) => void;
}

export function FloorplanCanvas({
  floorplan, selectedIds, zoom, readOnly, matchedId,
  onSelect, onCommitMove, onCommitResize, onCommitRotate, onDropNewObject, onOpenTable,
}: FloorplanCanvasProps) {
  const { t } = useT();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const elRefs = useRef(new Map<string, HTMLDivElement>());
  const guideVRef = useRef<HTMLDivElement | null>(null);
  const guideHRef = useRef<HTMLDivElement | null>(null);

  const dragState = useRef<DragState | null>(null);
  const resizeState = useRef<ResizeState | null>(null);
  const rotateState = useRef<RotateState | null>(null);
  const marqueeState = useRef<MarqueeState | null>(null);
  const marqueeElRef = useRef<HTMLDivElement | null>(null);
  const selectedSet = useRef(new Set(selectedIds));
  selectedSet.current = new Set(selectedIds);
  const floorplanRef = useRef(floorplan);
  floorplanRef.current = floorplan;

  const toLocal = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  }, [zoom]);

  const setGuides = useCallback((v: number | null, h: number | null) => {
    if (guideVRef.current) {
      guideVRef.current.style.display = v === null ? 'none' : 'block';
      if (v !== null) guideVRef.current.style.left = v + 'px';
    }
    if (guideHRef.current) {
      guideHRef.current.style.display = h === null ? 'none' : 'block';
      if (h !== null) guideHRef.current.style.top = h + 'px';
    }
  }, []);

  // ---- object drag ----
  const onObjPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, obj: FloorplanObject) => {
    if (readOnly) return;
    e.stopPropagation();
    const alreadyMultiSelected = selectedSet.current.has(obj.id) && selectedSet.current.size > 1;
    const ids = alreadyMultiSelected ? [...selectedSet.current] : [obj.id];
    if (!alreadyMultiSelected) onSelect?.([obj.id]);
    const { x: startPx, y: startPy } = toLocal(e.clientX, e.clientY);
    const initial: Record<string, { x: number; y: number }> = {};
    ids.forEach((id) => {
      const o = floorplanRef.current.find((o2) => o2.id === id);
      if (o) initial[id] = { x: o.x, y: o.y };
    });
    dragState.current = { primaryId: obj.id, ids, initial, startPx, startPy, dragged: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [onSelect, readOnly, toLocal]);

  const onObjPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragState.current;
    if (!ds) return;
    const primary = floorplanRef.current.find((o) => o.id === ds.primaryId);
    const primInit = ds.initial[ds.primaryId];
    if (!primary || !primInit) return;
    const { x: px, y: py } = toLocal(e.clientX, e.clientY);
    const dx = px - ds.startPx;
    const dy = py - ds.startPy;
    let nx = Math.max(0, Math.min(primInit.x + dx, CANVAS_W - primary.w));
    let ny = Math.max(0, Math.min(primInit.y + dy, CANVAS_H - primary.h));
    const others = floorplanRef.current.filter((o) => o.id !== primary.id);
    const snapped = findSnap(nx, ny, primary.w, primary.h, others);
    nx = snapped.x;
    ny = snapped.y;
    setGuides(snapped.guideV, snapped.guideH);

    let effDx = nx - primInit.x;
    let effDy = ny - primInit.y;
    let minDx = -Infinity, maxDx = Infinity, minDy = -Infinity, maxDy = Infinity;
    ds.ids.forEach((id) => {
      const o = floorplanRef.current.find((o2) => o2.id === id);
      const init = ds.initial[id];
      if (!o || !init) return;
      minDx = Math.max(minDx, -init.x);
      maxDx = Math.min(maxDx, CANVAS_W - o.w - init.x);
      minDy = Math.max(minDy, -init.y);
      maxDy = Math.min(maxDy, CANVAS_H - o.h - init.y);
    });
    effDx = Math.max(minDx, Math.min(maxDx, effDx));
    effDy = Math.max(minDy, Math.min(maxDy, effDy));
    if (Math.abs(effDx) > 2 || Math.abs(effDy) > 2) ds.dragged = true;

    ds.ids.forEach((id) => {
      const init = ds.initial[id];
      if (!init) return;
      const el = elRefs.current.get(id);
      if (el) {
        el.style.left = init.x + effDx + 'px';
        el.style.top = init.y + effDy + 'px';
      }
    });
  }, [setGuides, toLocal]);

  const onObjPointerUp = useCallback(() => {
    const ds = dragState.current;
    dragState.current = null;
    setGuides(null, null);
    if (!ds || !ds.dragged) return;
    // Re-derive the final committed positions from the elements' inline styles we just set.
    const changes = ds.ids.map((id) => {
      const el = elRefs.current.get(id);
      return { id, x: parseFloat(el?.style.left || '0'), y: parseFloat(el?.style.top || '0') };
    });
    onCommitMove?.(changes);
  }, [onCommitMove, setGuides]);

  // ---- resize ----
  const onResizePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, obj: FloorplanObject) => {
    e.stopPropagation();
    e.preventDefault();
    resizeState.current = { id: obj.id, startX: e.clientX, startY: e.clientY, w0: obj.w, h0: obj.h, rot0: obj.rot || 0, changed: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rs = resizeState.current;
    if (!rs) return;
    const obj = floorplanRef.current.find((o) => o.id === rs.id);
    if (!obj) return;
    const dxCanvas = (e.clientX - rs.startX) / zoom;
    const dyCanvas = (e.clientY - rs.startY) / zoom;
    const { dx: dxLocal, dy: dyLocal } = unrotateDelta(dxCanvas, dyCanvas, rs.rot0);
    const { w, h } = applyResizeDelta(obj.type, rs.w0, rs.h0, dxLocal, dyLocal);
    if (w !== obj.w || h !== obj.h) rs.changed = true;
    const el = elRefs.current.get(obj.id);
    if (el) {
      el.style.width = w + 'px';
      el.style.height = h + 'px';
    }
    (rs as ResizeState & { lastW?: number; lastH?: number }).lastW = w;
    (rs as ResizeState & { lastW?: number; lastH?: number }).lastH = h;
  }, [zoom]);

  const onResizePointerUp = useCallback(() => {
    const rs = resizeState.current as (ResizeState & { lastW?: number; lastH?: number }) | null;
    resizeState.current = null;
    if (!rs || !rs.changed) return;
    onCommitResize?.(rs.id, rs.lastW ?? rs.w0, rs.lastH ?? rs.h0);
  }, [onCommitResize]);

  // ---- rotate ----
  const onRotatePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, obj: FloorplanObject) => {
    e.stopPropagation();
    e.preventDefault();
    rotateState.current = { id: obj.id, changed: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onRotatePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rs = rotateState.current;
    if (!rs) return;
    const obj = floorplanRef.current.find((o) => o.id === rs.id);
    if (!obj) return;
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    const { x: px, y: py } = toLocal(e.clientX, e.clientY);
    const snap = rotationFromPointer(cx, cy, px, py);
    if (snap.deg !== (obj.rot || 0)) rs.changed = true;
    const el = elRefs.current.get(obj.id);
    if (el) {
      el.style.transform = `rotate(${snap.deg}deg)`;
      const line = el.querySelector('.rotate-handle-line');
      const handle = el.querySelector('.rotate-handle');
      const badge = el.querySelector<HTMLElement>('.rotate-angle-badge');
      line?.classList.toggle('snapped', snap.snapped);
      handle?.classList.toggle('snapped', snap.snapped);
      if (badge) {
        badge.style.display = 'block';
        badge.textContent = Math.round(snap.deg) + '°';
        badge.classList.toggle('snapped', snap.snapped);
      }
    }
    (rs as RotateState & { lastDeg?: number }).lastDeg = snap.deg;
  }, [toLocal]);

  const onRotatePointerUp = useCallback(() => {
    const rs = rotateState.current as (RotateState & { lastDeg?: number }) | null;
    rotateState.current = null;
    if (!rs || !rs.changed) return;
    onCommitRotate?.(rs.id, rs.lastDeg ?? 0);
  }, [onCommitRotate]);

  // ---- marquee (drag-select on empty canvas area) ----
  const onCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly) return;
    if (e.target !== e.currentTarget) return;
    const { x: startX, y: startY } = toLocal(e.clientX, e.clientY);
    marqueeState.current = { startX, startY, dragged: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [readOnly, toLocal]);

  const onCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const ms = marqueeState.current;
    if (!ms) return;
    const { x: curX, y: curY } = toLocal(e.clientX, e.clientY);
    const x = Math.min(curX, ms.startX);
    const y = Math.min(curY, ms.startY);
    const w = Math.abs(curX - ms.startX);
    const h = Math.abs(curY - ms.startY);
    if (w > 3 || h > 3) ms.dragged = true;
    const box = marqueeElRef.current;
    if (box) {
      box.style.display = 'block';
      box.style.left = x + 'px';
      box.style.top = y + 'px';
      box.style.width = w + 'px';
      box.style.height = h + 'px';
    }
    (ms as MarqueeState & { rect?: { x: number; y: number; w: number; h: number } }).rect = { x, y, w, h };
  }, [toLocal]);

  const onCanvasPointerUp = useCallback(() => {
    const ms = marqueeState.current as (MarqueeState & { rect?: { x: number; y: number; w: number; h: number } }) | null;
    marqueeState.current = null;
    if (marqueeElRef.current) marqueeElRef.current.style.display = 'none';
    if (ms && ms.dragged && ms.rect) {
      const { x, y, w, h } = ms.rect;
      const matched = floorplanRef.current.filter(
        (o) => o.x < x + w && o.x + o.w > x && o.y < y + h && o.y + o.h > y
      );
      onSelect?.(matched.map((o) => o.id));
    } else {
      onSelect?.([]);
    }
  }, [onSelect]);

  // ---- native HTML5 drop from the object picker ----
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain') as FloorplanObject['type'];
    if (!type) return;
    const { x, y } = toLocal(e.clientX, e.clientY);
    onDropNewObject?.(type, x, y);
  }, [onDropNewObject, toLocal]);

  useEffect(() => {
    elRefs.current.forEach((_el, id) => {
      if (!floorplan.some((o) => o.id === id)) elRefs.current.delete(id);
    });
  }, [floorplan]);

  return (
    <div
      ref={canvasRef}
      className="canvas"
      style={{ transform: `scale(${zoom})` }}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      onDragOver={readOnly ? undefined : onDragOver}
      onDrop={readOnly ? undefined : onDrop}
    >
      {floorplan.map((o) => {
        const selected = selectedSet.current.has(o.id);
        const isTable = isTableType(o.type);
        const rotatable = isRotatableType(o.type);
        return (
          <div
            key={o.id}
            ref={(el) => {
              if (el) elRefs.current.set(o.id, el);
            }}
            className={`obj ${o.type}${selected ? ' selected' : ''}${matchedId === o.id ? ' has-match' : ''}`}
            style={{ left: o.x, top: o.y, width: o.w, height: o.h, transform: `rotate(${o.rot || 0}deg)`, transformOrigin: 'center center' }}
            onPointerDown={(e) => onObjPointerDown(e, o)}
            onPointerMove={onObjPointerMove}
            onPointerUp={onObjPointerUp}
            onClick={() => {
              if (readOnly) onOpenTable?.(o);
            }}
          >
            {isTable && seatPositions(o.type, o.w, o.h, o.capacity).map((p, i) => (
              <div key={i} className="seat-dot" style={{ left: p.x, top: p.y }} />
            ))}
            <div className="label">{o.label}</div>
            {isTable && <div className="sub">{t('seatsCount', o.capacity)}</div>}
            {!readOnly && selected && selectedIds.length === 1 && (
              <div
                className="resize-handle"
                title={t('resizeHandleTitle')}
                onPointerDown={(e) => onResizePointerDown(e, o)}
                onPointerMove={onResizePointerMove}
                onPointerUp={onResizePointerUp}
              />
            )}
            {!readOnly && selected && selectedIds.length === 1 && rotatable && (
              <>
                <div className="rotate-handle-line" />
                <div
                  className="rotate-handle"
                  title={t('rotateHandleTitle')}
                  onPointerDown={(e) => onRotatePointerDown(e, o)}
                  onPointerMove={onRotatePointerMove}
                  onPointerUp={onRotatePointerUp}
                />
                <div className="rotate-angle-badge" style={{ display: 'none' }}>{Math.round(o.rot || 0)}°</div>
              </>
            )}
          </div>
        );
      })}
      {!readOnly && (
        <>
          <div ref={guideVRef} className="guide guide-v" style={{ display: 'none' }} />
          <div ref={guideHRef} className="guide guide-h" style={{ display: 'none' }} />
          <div ref={marqueeElRef} className="marquee-box" style={{ display: 'none' }} />
        </>
      )}
    </div>
  );
}
