import { useRef } from 'react';
import { usePlan } from '../../state/PlanProvider';
import { useT } from '../../i18n/I18nContext';
import { useToast } from '../../components/Toast';
import { useZoom } from '../../hooks/useZoom';
import { DEFAULTS, defaultObjectLabel, type FloorplanObject, type ObjectType } from '../../../domain/floorplan';
import { nextObjectId } from '../../../state/planState';
import type { Dictionary } from '../../../domain/i18n';
import { ObjectPicker } from './ObjectPicker';
import { FloorplanCanvas } from './FloorplanCanvas';
import { SidePanel } from './SidePanel';

export function EditTab() {
  const { state, dispatch } = usePlan();
  const { t } = useT();
  const { showToast } = useToast();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { zoom, zoomIn, zoomOut, fitToScreen, ensureInitialFit, onWheel } = useZoom(scrollRef);

  function handleAdd(type: ObjectType, x?: number, y?: number) {
    const d = DEFAULTS[type];
    const label = defaultObjectLabel(type, state.floorplan, (key) => t(key as keyof Dictionary));
    const object: FloorplanObject = {
      id: nextObjectId(state.idCounter),
      type,
      x: x ?? 40 + Math.random() * 100,
      y: y ?? 40 + Math.random() * 100,
      w: d.w,
      h: d.h,
      rot: 0,
      label,
      capacity: d.capacity,
    };
    dispatch({ type: 'ADD_OBJECT', object });
  }

  function handleDelete(id: string) {
    dispatch({ type: 'DELETE_OBJECTS', ids: [id] });
  }

  function handleDeleteMulti() {
    const n = state.selectedIds.length;
    if (!n) return;
    dispatch({ type: 'DELETE_OBJECTS', ids: state.selectedIds });
    showToast(n > 1 ? t('toastDeleteMulti', n) : t('toastDeleteOne'));
  }

  const selectedObjects = state.floorplan.filter((o) => state.selectedIds.includes(o.id));

  return (
    <div className="panel">
      <h2><span className="n">01</span>{t('panelAddObjectTitle')}</h2>
      <div className="hint">{t('panelAddObjectHint')}</div>
      <ObjectPicker onAdd={(type) => handleAdd(type)} />
      <div className="zoom-toolbar">
        <button className="chip zoom-btn" title={t('zoomOutTitle')} onClick={zoomOut}>−</button>
        <span className="zlabel">{Math.round(zoom * 100)}%</span>
        <button className="chip zoom-btn" title={t('zoomInTitle')} onClick={zoomIn}>+</button>
        <button className="chip" title={t('zoomFitTitle')} onClick={fitToScreen}>{t('zoomFit')}</button>
        <span className="zoom-hint">{t('zoomHint')}</span>
      </div>
      <div className="layout-grid">
        <div
          className="canvas-scroll"
          id="editCanvasScroll"
          ref={(el) => {
            scrollRef.current = el;
            if (el) ensureInitialFit();
          }}
          onWheel={onWheel}
        >
          <div className="canvas-zoom-wrap" style={{ width: 1400 * zoom, height: 900 * zoom }}>
            <FloorplanCanvas
              floorplan={state.floorplan}
              selectedIds={state.selectedIds}
              zoom={zoom}
              readOnly={false}
              onSelect={(ids) => dispatch({ type: 'SET_SELECTION', ids })}
              onCommitMove={(changes) => dispatch({ type: 'MOVE_OBJECTS', changes })}
              onCommitResize={(id, w, h) => dispatch({ type: 'RESIZE_OBJECT', id, w, h })}
              onCommitRotate={(id, rot) => dispatch({ type: 'ROTATE_OBJECT', id, rot })}
              onDropNewObject={(type, x, y) => {
                const d = DEFAULTS[type];
                const cx = Math.max(0, Math.min(x - d.w / 2, 1400 - d.w));
                const cy = Math.max(0, Math.min(y - d.h / 2, 900 - d.h));
                handleAdd(type, cx, cy);
              }}
            />
          </div>
        </div>
        <div className="panel side-panel" style={{ marginTop: 0 }}>
          <h2 style={{ marginBottom: 6 }}>{t('sidePanelTitle')}</h2>
          <SidePanel
            selected={selectedObjects}
            onUpdateFields={(id, fields) => dispatch({ type: 'UPDATE_OBJECT_FIELDS', id, fields })}
            onDelete={handleDelete}
            onDeleteMulti={handleDeleteMulti}
            onClearSelection={() => dispatch({ type: 'SET_SELECTION', ids: [] })}
          />
        </div>
      </div>
    </div>
  );
}
