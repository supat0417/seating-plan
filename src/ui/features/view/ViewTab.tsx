import { useEffect, useRef, useState } from 'react';
import { usePlan } from '../../state/PlanProvider';
import { useT } from '../../i18n/I18nContext';
import { useZoom } from '../../hooks/useZoom';
import { normTable, formatTableLabel } from '../../../domain/floorplan';
import type { FloorplanObject } from '../../../domain/floorplan';
import { FloorplanCanvas } from '../edit/FloorplanCanvas';
import { TableModal } from './TableModal';
import { SearchIcon } from '../../components/Icons';
import { useNavigation } from '../../state/NavigationContext';

export function ViewTab() {
  const { state } = usePlan();
  const { t } = useT();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { zoom, zoomIn, zoomOut, fitToScreen, ensureInitialFit, onWheel } = useZoom(scrollRef);
  const { consumePendingHighlight } = useNavigation();

  const [query, setQuery] = useState('');
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const [modalObj, setModalObj] = useState<FloorplanObject | null>(null);

  function highlightTable(tableLabel: string) {
    const obj = state.floorplan.find((o) => normTable(o.label) === normTable(tableLabel));
    if (!obj) {
      alert(t('alertTableNotFound', tableLabel));
      setMatchedId(null);
      return;
    }
    setMatchedId(obj.id);
    setModalObj(obj);
  }

  useEffect(() => {
    const pending = consumePendingHighlight();
    if (pending) highlightTable(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matches = query.trim().length === 0 ? [] : state.guests.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 20);

  return (
    <>
      <div className="panel">
        <h2><span className="n">01</span>{t('panelSearchTitle')}</h2>
        <div className="banner">{t('sharedBanner')}</div>
        <div className="search-wrap">
          <span className="sicon"><SearchIcon size={15} /></span>
          <input type="text" placeholder={t('searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="search-results">
          {query.trim().length > 0 && matches.length === 0 && <div className="hint">{t('noSearchMatch')}</div>}
          {matches.map((g, i) => (
            <div key={i} className="result-row" onClick={() => highlightTable(g.table)}>
              <span className="rname">{g.name}</span>
              <span className="rtable">{formatTableLabel(g.table, t('tableWordPrefix'))} · {t('seatInline', g.seat)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h2><span className="n">02</span>{t('panelFloorplanTitle')}</h2>
        <div className="hint">{t('panelFloorplanHint')}</div>
        <div className="zoom-toolbar">
          <button className="chip zoom-btn" title={t('zoomOutTitle')} onClick={zoomOut}>−</button>
          <span className="zlabel">{Math.round(zoom * 100)}%</span>
          <button className="chip zoom-btn" title={t('zoomInTitle')} onClick={zoomIn}>+</button>
          <button className="chip" title={t('zoomFitTitle')} onClick={fitToScreen}>{t('zoomFit')}</button>
          <span className="zoom-hint">{t('zoomHint')}</span>
        </div>
        <div
          className="canvas-scroll"
          ref={(el) => {
            scrollRef.current = el;
            if (el) ensureInitialFit();
          }}
          onWheel={onWheel}
        >
          {state.floorplan.length === 0 ? (
            <div className="empty-note" style={{ position: 'absolute', top: 20, left: 20 }}>{t('noFloorplanYet')}</div>
          ) : (
            <div className="canvas-zoom-wrap" style={{ width: 1400 * zoom, height: 900 * zoom }}>
              <FloorplanCanvas
                floorplan={state.floorplan}
                selectedIds={[]}
                zoom={zoom}
                readOnly
                matchedId={matchedId}
                onOpenTable={(obj) => setModalObj(obj)}
              />
            </div>
          )}
        </div>
      </div>
      {modalObj && <TableModal obj={modalObj} onClose={() => setModalObj(null)} />}
    </>
  );
}
