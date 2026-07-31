import { useEffect, useRef, useState } from 'react';
import { usePlan, clearPlanCache } from '../../state/PlanProvider';
import { useT } from '../../i18n/I18nContext';
import { useToast } from '../../components/Toast';
import { useNavigation } from '../../state/NavigationContext';
import type { Mode } from '../../../state/planState';
import { buildExportData, normalizeImportedFloorplan, normalizeImportedGuests, parseImportJson, resolveImportedTheme, type ExportedTheme } from '../../../domain/jsonSchema';
import {
  BrandIcon, EditIcon, GuestsIcon, SearchIcon, UndoIcon, RedoIcon,
  HelpIcon, PaletteIcon, DownloadIcon, UploadIcon, TrashIcon,
} from '../../components/Icons';
import { HelpModal } from '../../components/HelpModal';
import { ThemeModal, themeButtonDotColor } from './ThemeModal';

const TABS: Array<{ mode: Mode; labelKey: 'tabEdit' | 'tabGuests' | 'tabPreview' }> = [
  { mode: 'edit', labelKey: 'tabEdit' },
  { mode: 'guests', labelKey: 'tabGuests' },
  { mode: 'view', labelKey: 'tabPreview' },
];

export function Topbar() {
  const { state, dispatch } = usePlan();
  const { t, lang } = useT();
  const { showToast } = useToast();
  const { requestHighlight } = useNavigation();
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const canUndoRedo = state.mode === 'edit' || state.mode === 'guests';

  useEffect(() => {
    if (!searchOpen) return;
    function onOutside(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('click', onOutside);
    return () => document.removeEventListener('click', onOutside);
  }, [searchOpen]);

  const matches = searchQuery.trim().length === 0 ? [] : state.guests.filter((g) => g.name.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 20);

  function handleUndo() {
    if (state.undoStack.length === 0) {
      showToast(t('toastNoUndo'));
      return;
    }
    dispatch({ type: 'UNDO' });
    showToast(t('toastUndoDone'));
  }
  function handleRedo() {
    if (state.redoStack.length === 0) {
      showToast(t('toastNoRedo'));
      return;
    }
    dispatch({ type: 'REDO' });
    showToast(t('toastRedoDone'));
  }

  function handleExport() {
    const themeOut: ExportedTheme = state.theme === 'custom'
      ? { id: 'custom', colors: [state.customColors.c60, state.customColors.c25, state.customColors.c10, state.customColors.c5] }
      : state.theme;
    const data = buildExportData({ floorplan: state.floorplan, guests: state.guests, theme: themeOut, lang });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(t('toastExported'));
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseImportJson(String(reader.result));
      if ('error' in parsed) {
        const key = parsed.error === 'badJson' ? 'alertBadJson' : parsed.error === 'noData' ? 'alertNoDataInFile' : parsed.error === 'badFloorplan' ? 'alertBadFloorplanFormat' : 'alertBadGuestFormat';
        alert(t(key));
        return;
      }
      const parts: string[] = [];
      if (parsed.floorplanRaw) parts.push(t('importPartFloorplan', state.floorplan.length, parsed.floorplanRaw.length));
      if (parsed.guestsRaw) parts.push(t('importPartGuests', state.guests.length, parsed.guestsRaw.length));
      if (!confirm(`${t('confirmImportPrefix')} ${parts.join(', ')} ${t('confirmImportSuffix')}`)) return;

      dispatch({
        type: 'IMPORT_DATA',
        floorplan: parsed.floorplanRaw ? normalizeImportedFloorplan(parsed.floorplanRaw) : undefined,
        guests: parsed.guestsRaw ? normalizeImportedGuests(parsed.guestsRaw) : undefined,
      });
      if (parsed.theme !== undefined) {
        const resolved = resolveImportedTheme(parsed.theme);
        if (resolved.kind === 'custom') {
          dispatch({ type: 'SET_CUSTOM_COLOR', slot: 'c60', hex: resolved.colors.c60 });
          dispatch({ type: 'SET_CUSTOM_COLOR', slot: 'c25', hex: resolved.colors.c25 });
          dispatch({ type: 'SET_CUSTOM_COLOR', slot: 'c10', hex: resolved.colors.c10 });
          dispatch({ type: 'SET_CUSTOM_COLOR', slot: 'c5', hex: resolved.colors.c5 });
          dispatch({ type: 'SET_THEME', theme: 'custom' });
        } else if (resolved.kind === 'preset') {
          dispatch({ type: 'SET_THEME', theme: resolved.id });
        } else {
          dispatch({ type: 'SET_THEME', theme: null });
        }
      }
      showToast(t('toastImportSuccess'));
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleClearCache() {
    if (!confirm(t('confirmClearCache'))) return;
    clearPlanCache(dispatch);
    showToast(t('toastCacheCleared'));
  }

  const themeDot = themeButtonDotColor(state.theme, state.customColors, t('themeCustomLabel'));

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark"><BrandIcon size={20} /></div>
        <div>
          <div className="eyebrow">{t('eyebrow')}</div>
          <h1>{t('appTitle')}</h1>
        </div>
      </div>
      <div className="topbar-controls">
        <div className="tabs">
          {TABS.map((tb) => (
            <button key={tb.mode} className={`tab-btn${state.mode === tb.mode ? ' active' : ''}`} onClick={() => dispatch({ type: 'SET_MODE', mode: tb.mode })}>
              {tb.mode === 'edit' && <EditIcon size={15} />}
              {tb.mode === 'guests' && <GuestsIcon size={15} />}
              {tb.mode === 'view' && <SearchIcon size={15} />}
              {t(tb.labelKey)}
            </button>
          ))}
        </div>
        <div className="toolbar" style={{ margin: 0 }}>
          <div className="search-popover-wrap" ref={searchWrapRef}>
            <button className="chip icon-chip" title={t('searchBtnTitle')} aria-label={t('searchBtn')} onClick={() => setSearchOpen((v) => !v)}>
              <SearchIcon size={16} />
            </button>
            {searchOpen && (
              <div className="search-popover">
                <div className="search-wrap">
                  <span className="sicon"><SearchIcon size={15} /></span>
                  <input type="text" autoFocus placeholder={t('searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="search-results">
                  {searchQuery.trim().length > 0 && matches.length === 0 && <div className="hint">{t('noSearchMatch')}</div>}
                  {matches.map((g, i) => (
                    <div
                      key={i}
                      className="result-row"
                      onClick={() => {
                        setSearchOpen(false);
                        if (state.mode !== 'view') dispatch({ type: 'SET_MODE', mode: 'view' });
                        requestHighlight(g.table);
                      }}
                    >
                      <span className="rname">{g.name}</span>
                      <span className="rtable">{g.table} · {t('seatInline', g.seat)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="chip icon-chip" title={t('undoBtnTitle')} aria-label={t('undoBtnTitle')} disabled={!canUndoRedo} onClick={handleUndo}><UndoIcon size={15} /></button>
          <button className="chip icon-chip" title={t('redoBtnTitle')} aria-label={t('redoBtnTitle')} disabled={!canUndoRedo} onClick={handleRedo}><RedoIcon size={15} /></button>
          <span className="toolbar-sep" />
          <button className="chip" title={t('helpBtnTitle')} onClick={() => setShowHelp(true)}><HelpIcon size={15} />{t('helpBtn')}</button>
          <button className="chip" title={t('themeBtnTitle')} onClick={() => setShowTheme(true)}>
            <PaletteIcon size={15} />{t('themeBtn')}
            {themeDot && <span className="theme-btn-dot" style={{ background: themeDot }} />}
          </button>
          <button className="chip" title={t('exportBtnTitle')} onClick={handleExport}><DownloadIcon size={15} />{t('exportBtn')}</button>
          <button className="chip" title={t('importBtnTitle')} onClick={() => importInputRef.current?.click()}><UploadIcon size={15} />{t('importBtn')}</button>
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            ref={importInputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = '';
            }}
          />
          <button className="chip danger" title={t('clearCacheBtnTitle')} onClick={handleClearCache}><TrashIcon size={15} />{t('clearCacheBtn')}</button>
          <div className="lang-toggle" title={t('langToggleTitle')}>
            <button className={`lang-opt${lang === 'th' ? ' active' : ''}`} onClick={() => dispatch({ type: 'SET_LANG', lang: 'th' })}>TH</button>
            <button className={`lang-opt${lang === 'en' ? ' active' : ''}`} onClick={() => dispatch({ type: 'SET_LANG', lang: 'en' })}>EN</button>
          </div>
        </div>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showTheme && <ThemeModal onClose={() => setShowTheme(false)} />}
    </div>
  );
}
