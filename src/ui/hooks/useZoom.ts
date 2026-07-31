import { useCallback, useRef, useState } from 'react';
import { CANVAS_H, CANVAS_W } from '../../domain/floorplan';

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
const AUTO_FIT_MIN = 0.7;

function clampZoom(z: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z * 100) / 100));
}

function computeFitZoom(scrollEl: HTMLElement | null): number {
  if (!scrollEl || !scrollEl.clientWidth || !scrollEl.clientHeight) return 1;
  const ratio = Math.min(scrollEl.clientWidth / CANVAS_W, scrollEl.clientHeight / CANVAS_H, 1);
  return clampZoom(ratio);
}

/** Ports the original's per-canvas zoom state (editZoom/viewZoom): auto-fits once on first
 * mount (floor of 0.7), then supports +/- buttons, "fit to screen", and Ctrl+wheel zoom
 * anchored at the cursor. */
export function useZoom(scrollRef: React.RefObject<HTMLDivElement | null>) {
  const [zoom, setZoomState] = useState(1);
  const fittedRef = useRef(false);

  const applyZoom = useCallback(
    (z: number, anchorClientX?: number, anchorClientY?: number) => {
      const next = clampZoom(z);
      const scrollEl = scrollRef.current;
      if (scrollEl && anchorClientX != null && anchorClientY != null) {
        const rect = scrollEl.getBoundingClientRect();
        const localX = (scrollEl.scrollLeft + anchorClientX - rect.left) / zoom;
        const localY = (scrollEl.scrollTop + anchorClientY - rect.top) / zoom;
        setZoomState(next);
        requestAnimationFrame(() => {
          scrollEl.scrollLeft = localX * next - (anchorClientX - rect.left);
          scrollEl.scrollTop = localY * next - (anchorClientY - rect.top);
        });
      } else {
        setZoomState(next);
      }
    },
    [scrollRef, zoom]
  );

  const fitToScreen = useCallback(() => {
    applyZoom(computeFitZoom(scrollRef.current));
  }, [applyZoom, scrollRef]);

  const ensureInitialFit = useCallback(() => {
    if (fittedRef.current) return;
    fittedRef.current = true;
    const fit = Math.max(AUTO_FIT_MIN, computeFitZoom(scrollRef.current));
    setZoomState(fit);
  }, [scrollRef]);

  const zoomIn = useCallback(() => applyZoom(zoom + ZOOM_STEP), [applyZoom, zoom]);
  const zoomOut = useCallback(() => applyZoom(zoom - ZOOM_STEP), [applyZoom, zoom]);

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      applyZoom(zoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), e.clientX, e.clientY);
    },
    [applyZoom, zoom]
  );

  return { zoom, zoomIn, zoomOut, fitToScreen, ensureInitialFit, onWheel };
}
