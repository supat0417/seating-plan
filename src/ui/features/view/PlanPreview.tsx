import { useEffect, useRef, useState } from 'react';
import { seatPositions, type FloorplanObject } from '../../../domain/floorplan';
import { seatRosterForTable, type Guest } from '../../../domain/guest';
import { useT } from '../../i18n/I18nContext';
import { useZoom } from '../../hooks/useZoom';
import { useNavigation } from '../../state/NavigationContext';

export function PlanPreview({
  floorplan,
  guests,
  logo,
}: {
  floorplan: FloorplanObject[];
  guests: Guest[];
  logo: string | null;
}) {
  const { t } = useT();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const { zoom, zoomIn, zoomOut, fitToScreen, onWheel } = useZoom(viewportRef);
  const [query, setQuery] = useState('');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [panelObj, setPanelObj] = useState<FloorplanObject | null>(null);
  const [highlightName, setHighlightName] = useState<string | null>(null);
  const [spotlightOn, setSpotlightOn] = useState(false);
  const [ringKey, setRingKey] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const panelBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => fitToScreen();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToScreen]);

  const guestCount = (obj: FloorplanObject) => guests.filter((guest) => guest.table.trim().toLowerCase() === obj.label.trim().toLowerCase()).length;
  const { consumePendingHighlight } = useNavigation();
  const tables = floorplan.filter((obj) => obj.type === 'round' || obj.type === 'long').sort((a, b) => String(a.label).localeCompare(String(b.label), 'th', { numeric: true }));
  const trimmedQuery = query.trim().toLowerCase();
  const matches = trimmedQuery ? guests.filter((guest) => guest.name.toLowerCase().includes(trimmedQuery)).slice(0, 24) : [];
  const roster = panelObj ? seatRosterForTable(guests, panelObj) : [];
  const filled = roster.filter((row) => !row.empty).length;

  function focusTable(obj: FloorplanObject, name: string | null) {
    setFocusedId(obj.id);
    setHighlightName(name);
    setSpotlightOn(true);
    setRingKey((key) => key + 1);
    setHintVisible(false);
    window.setTimeout(() => setPanelObj(obj), 780);
  }

  function resetView() {
    fitToScreen();
    setFocusedId(null);
    setSpotlightOn(false);
    setPanelObj(null);
    setHighlightName(null);
    setHintVisible(true);
  }

  useEffect(() => {
    const pending = consumePendingHighlight();
    if (!pending) return;
    const obj = floorplan.find((item) => item.label.trim().toLowerCase() === pending.trim().toLowerCase());
    if (obj) focusTable(obj, null);
  }, [consumePendingHighlight, floorplan]);

  return (
    <div className="display-preview">
      <div className="display-bg-glow" />
      <div className="display-sparkles" aria-hidden="true" />
      <section className="display-hero">
        {logo && <img className="display-hero-logo" src={logo} alt="" />}
        <div className="display-hero-eyebrow">{t('eyebrow')}</div>
        <h2>{t('appTitle')}</h2>
        <div className="display-flourish"><span /><b>◆</b><span /></div>
        <p>{t('panelFloorplanHint')}</p>
      </section>

      <section className="display-search-card">
        <div className="display-search-wrap">
          <span className="display-search-icon">⌕</span>
          <input type="text" placeholder={t('searchPlaceholder')} value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="display-search-results">
          {trimmedQuery && matches.length === 0 && <div className="display-search-empty">{t('noSearchMatch')}</div>}
          {matches.map((guest, index) => {
            const obj = floorplan.find((item) => item.label.trim().toLowerCase() === guest.table.trim().toLowerCase());
            return <button key={index} type="button" className="display-result-row" onClick={() => obj && focusTable(obj, guest.name)}>
              <span>{guest.name}</span><strong>{guest.table} · {t('seatInline', guest.seat)}</strong>
            </button>;
          })}
        </div>
      </section>

      {tables.length > 0 && <div className="display-chips-row">
        <div className="display-chips-label">{t('panelFloorplanTitle')}</div>
        {tables.map((obj) => <button key={obj.id} type="button" onClick={() => focusTable(obj, null)}>{obj.label}</button>)}
      </div>}

      <div className="preview-plan-card">
        <div className="preview-plan-head">
          <div className="preview-plan-title">{t('panelFloorplanTitle')}</div>
        <div className="preview-plan-legend">
          <div className="preview-leg-item"><span className="preview-leg-dot" />{t('objTypeRound')}</div>
          <div className="preview-leg-item"><span className="preview-leg-dot long" />{t('objTypeLong')}</div>
          <div className="preview-leg-item"><span className="preview-leg-dot stage" />{t('objTypeStage')}</div>
          <div className="preview-leg-item"><span className="preview-leg-dot door" />{t('objTypeDoor')}</div>
        </div>
      </div>
      <div
        className="preview-viewport"
        ref={(element) => {
          viewportRef.current = element;
          if (element) fitToScreen();
        }}
        onWheel={onWheel}
      >
        <div className="preview-floor-canvas" style={{ transform: `scale(${zoom})` }}>
          {floorplan.map((obj) => {
            const isTable = obj.type === 'round' || obj.type === 'long';
            const isFocused = focusedId === obj.id;
            const dimmed = focusedId !== null && !isFocused;
            return (
              <button
                key={obj.id}
                type="button"
                className={`preview-table-node ${obj.type}${isFocused ? ' focused' : ''}${dimmed ? ' dimmed' : ''}`}
                style={{ left: obj.x, top: obj.y, width: obj.w, height: obj.h, transform: `rotate(${obj.rot || 0}deg)` }}
                onClick={() => focusTable(obj, null)}
              >
                {isTable && seatPositions(obj.type, obj.w, obj.h, obj.capacity).map((point, index) => (
                  <span key={index} className="preview-seat-mark" style={{ left: point.x + 0.5, top: point.y + 0.5 }} />
                ))}
                <span className="preview-table-label">{obj.label}</span>
                {isTable && <span className="preview-table-sub">{t('seatsCount', obj.capacity || 0)} · {guestCount(obj)}</span>}
              </button>
            );
          })}
        </div>
        <div className={`preview-spotlight${spotlightOn ? ' show' : ''}`} />
        <div key={ringKey} className={`preview-focus-ring${ringKey > 0 ? ' play' : ''}`} />
        <div className="preview-zoom-controls">
          <button type="button" title={t('zoomInTitle')} onClick={zoomIn}>+</button>
          <button type="button" className="home" title={t('zoomFitTitle')} onClick={fitToScreen}>⤢</button>
          <button type="button" title={t('zoomOutTitle')} onClick={zoomOut}>−</button>
        </div>
        <div className="preview-hint-tag" style={{ opacity: hintVisible ? 1 : 0 }}>{t('zoomHint')}</div>
        <div className={`display-guest-backdrop${panelObj ? ' show' : ''}`} onClick={resetView} />
        <aside className={`display-guest-panel${panelObj ? ' open' : ''}`}>
          <div className="display-guest-head">
            <button type="button" onClick={resetView} aria-label={t('modalCloseLabel')}>×</button>
            <small>{t('tableWordPrefix')}</small>
            <h3>{panelObj?.label ?? '—'}</h3>
            <span>{panelObj?.capacity ? t('capacityFraction', filled, panelObj.capacity) : t('seatsCount', filled)}</span>
          </div>
          <div className="display-guest-body" ref={panelBodyRef}>
            {roster.length === 0 ? <div className="display-guest-empty">{t('noGuestForTable')}</div> : <ul>
              {roster.map((row, index) => {
                const isMe = !row.empty && highlightName && row.name.trim().toLowerCase() === highlightName.trim().toLowerCase();
                return <li key={index} className={`${row.empty ? 'empty' : ''}${isMe ? ' me' : ''}`}>
                  <span>{row.empty ? t('emptyValuePlaceholder') : row.name}</span><b>{t('seatInline', row.seat)}</b>
                </li>;
              })}
            </ul>}
          </div>
          <div className="display-guest-foot"><button type="button" onClick={resetView}>{t('tabPreview')}</button></div>
        </aside>
      </div>
    </div>
    </div>
  );
}
