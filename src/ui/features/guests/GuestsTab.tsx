import { useRef } from 'react';
import { usePlan } from '../../state/PlanProvider';
import { useT } from '../../i18n/I18nContext';
import { useToast } from '../../components/Toast';
import { floorplanTables, seatConflictCounts, seatConflictKey, tableStatus, type Guest } from '../../../domain/guest';
import { normTable } from '../../../domain/floorplan';
import { buildGuestTemplateCsv, parseCSV } from '../../../domain/csv';
import { SearchIcon, TableStatusIcon, CloseIcon } from '../../components/Icons';

export function GuestsTab() {
  const { state, dispatch } = usePlan();
  const { t } = useT();
  const { showToast } = useToast();
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  function handleExportTemplate() {
    const result = buildGuestTemplateCsv(state.floorplan, { name: t('thName'), table: t('thTable'), seat: t('thSeat') });
    if (!result) {
      alert(t('alertNoTablesForTemplate'));
      return;
    }
    const blob = new Blob(['﻿' + result.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest-template-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(t('toastTemplateExported', result.rowCount));
  }

  function handleCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(String(reader.result));
      if (parsed.length === 0) {
        showToast(t('toastNoValidDataInFile'));
        return;
      }
      if (state.guests.length > 0 && !confirm(t('confirmCsvReplace'))) return;
      dispatch({ type: 'SET_GUESTS', guests: parsed });
      showToast(t('toastGuestsImported', parsed.length));
    };
    reader.readAsText(file, 'UTF-8');
  }

  const tables = floorplanTables(state.floorplan);

  return (
    <>
      <div className="panel">
        <h2><span className="n">01</span>{t('panelTemplateTitle')}</h2>
        <div className="hint">{t('panelTemplateHint')}</div>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <button className="chip" onClick={handleExportTemplate}>{t('exportTemplateBtn')}</button>
        </div>
      </div>
      <div className="panel">
        <h2><span className="n">02</span>{t('panelImportTitle')}</h2>
        <div className="hint">{t('panelImportHint')}</div>
        <input
          type="file"
          accept=".csv,text/csv"
          ref={csvInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleCsvFile(f);
            e.target.value = '';
          }}
        />
      </div>
      <div className="panel">
        <h2><span className="n">03</span>{t('panelGuestListTitle')}</h2>
        <div className="hint">{t('panelGuestListHint')}</div>
        <TableOverview tables={tables} />
        <div className="search-wrap" style={{ maxWidth: 360, marginBottom: 14 }}>
          <span className="sicon"><SearchIcon size={15} /></span>
          <input
            type="text"
            placeholder={t('guestFilterPlaceholder')}
            value={state.guestSearchQuery}
            onChange={(e) => dispatch({ type: 'SET_GUEST_SEARCH', query: e.target.value })}
          />
        </div>
        <GuestTable tables={tables} />
      </div>
    </>
  );
}

function TableOverview({ tables }: { tables: ReturnType<typeof floorplanTables> }) {
  const { state, dispatch } = usePlan();
  const { t } = useT();
  const knownKeys = new Set(tables.map((tb) => tb.key));
  const counts: Record<string, number> = {};
  let otherCount = 0;
  state.guests.forEach((g) => {
    const key = normTable(g.table);
    if (key && knownKeys.has(key)) counts[key] = (counts[key] || 0) + 1;
    else otherCount++;
  });

  function toggle(key: string | null) {
    dispatch({ type: 'SET_GUEST_FILTER', filter: state.guestTableFilter === key ? null : key });
  }

  return (
    <div className="table-overview">
      <button className={`table-chip${state.guestTableFilter === null ? ' active' : ''}`} onClick={() => dispatch({ type: 'SET_GUEST_FILTER', filter: null })}>
        <span className="tc-name">{t('allTablesChip')}</span>
        <span className="tc-count">{state.guests.length}</span>
      </button>
      {tables.map((tb) => {
        const count = counts[tb.key] || 0;
        const status = tableStatus(count, tb.capacity);
        const isNoCap = status === 'nocap';
        const title = isNoCap ? `${t('noCapTitle')} · ${t('clearFilterHint')}` : t('clearFilterHint');
        return (
          <button key={tb.key} className={`table-chip ${status}${state.guestTableFilter === tb.key ? ' active' : ''}`} title={title} onClick={() => toggle(tb.key)}>
            <span className={`tc-dot ${status}`}><TableStatusIcon status={status} /></span>
            <span className="tc-name">{tb.label}</span>
            <span className="tc-count">{count}/{tb.capacity}</span>
          </button>
        );
      })}
      {otherCount > 0 && (
        <button className={`table-chip${state.guestTableFilter === '__other__' ? ' active' : ''}`} title={t('clearFilterHint')} onClick={() => toggle('__other__')}>
          <span className="tc-dot over"><TableStatusIcon status="over" /></span>
          <span className="tc-name">{t('otherTableChip')}</span>
          <span className="tc-count">{otherCount}</span>
        </button>
      )}
    </div>
  );
}

interface SortableRow {
  tableOrder: number;
  tableKey: string;
  seatSort: string;
  key: string;
  node: React.ReactNode;
}

function GuestTable({ tables }: { tables: ReturnType<typeof floorplanTables> }) {
  const { state, dispatch } = usePlan();
  const { t } = useT();
  const { guests, guestTableFilter, guestSearchQuery } = state;

  const tableCount = new Set(guests.map((g) => g.table.trim().toLowerCase()).filter(Boolean)).size;
  const orderMap: Record<string, number> = {};
  tables.forEach((tb, idx) => { orderMap[tb.key] = idx; });
  const query = guestSearchQuery.trim().toLowerCase();

  const indices = guests
    .map((_g, i) => i)
    .filter((i) => {
      const g = guests[i];
      const key = normTable(g.table);
      if (guestTableFilter !== null) {
        if (guestTableFilter === '__other__') {
          if (key && orderMap[key] !== undefined) return false;
        } else if (key !== guestTableFilter) {
          return false;
        }
      }
      if (query && !(g.name + ' ' + g.table).toLowerCase().includes(query)) return false;
      return true;
    });

  const conflictCounts = seatConflictCounts(guests);
  const conflictGuestCount = guests.filter((g) => {
    const key = seatConflictKey(g);
    return key && conflictCounts[key] > 1;
  }).length;

  function updateGuest(idx: number, field: keyof Guest, value: string) {
    dispatch({ type: 'UPDATE_GUEST', index: idx, fields: { [field]: value } });
  }

  const realRows: SortableRow[] = indices.map((i) => {
    const g = guests[i];
    const key = seatConflictKey(g);
    const isDup = !!(key && conflictCounts[key] > 1);
    const dupTitle = isDup ? t('dupSeatTitle') : '';
    const tk = normTable(g.table);
    const rowKey = `g${i}-${g.name}-${g.table}-${g.seat}`;
    return {
      tableOrder: orderMap[tk] !== undefined ? orderMap[tk] : Infinity,
      tableKey: tk,
      seatSort: g.seat,
      key: rowKey,
      node: (
        <tr key={rowKey}>
          <td><input type="text" className="cell-input" defaultValue={g.name} placeholder={t('emptyValuePlaceholder')} onBlur={(e) => updateGuest(i, 'name', e.target.value)} /></td>
          <td><input type="text" className={`cell-input${isDup ? ' dup-seat' : ''}`} defaultValue={g.table} placeholder={t('emptyValuePlaceholder')} title={dupTitle} onBlur={(e) => updateGuest(i, 'table', e.target.value)} /></td>
          <td className="col-seat"><input type="text" className={`cell-input${isDup ? ' dup-seat' : ''}`} defaultValue={g.seat} placeholder={t('emptyValuePlaceholder')} title={dupTitle} onBlur={(e) => updateGuest(i, 'seat', e.target.value)} /></td>
          <td className="col-del"><button className="row-del-btn" title={t('deleteGuestTitle')} onClick={() => dispatch({ type: 'DELETE_GUEST', index: i })}><CloseIcon size={13} /></button></td>
        </tr>
      ),
    };
  });

  const filterTable = guestTableFilter && guestTableFilter !== '__other__' ? tables.find((tb) => tb.key === guestTableFilter) : null;
  const emptyRows: SortableRow[] = [];
  if (filterTable && filterTable.capacity > 0) {
    const takenSeats = new Set(guests.filter((g) => normTable(g.table) === filterTable.key).map((g) => String(g.seat || '').trim()));
    for (let s = 1; s <= filterTable.capacity; s++) {
      const seatStr = String(s);
      if (takenSeats.has(seatStr)) continue;
      if (query && !filterTable.label.toLowerCase().includes(query)) continue;
      emptyRows.push({
        tableOrder: orderMap[filterTable.key] !== undefined ? orderMap[filterTable.key] : Infinity,
        tableKey: filterTable.key,
        seatSort: seatStr,
        key: `e${seatStr}`,
        node: (
          <tr key={`e${seatStr}`} className="empty-seat-row">
            <td>
              <input type="text" className="cell-input" placeholder={t('emptyValuePlaceholder')} defaultValue=""
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  if (!name) return;
                  dispatch({ type: 'SET_GUESTS', guests: [...guests, { name: e.target.value, table: filterTable.label, seat: seatStr }] });
                  e.target.value = '';
                }}
              />
            </td>
            <td><input type="text" className="cell-input" value={filterTable.label} disabled readOnly /></td>
            <td className="col-seat"><input type="text" className="cell-input" value={seatStr} disabled readOnly /></td>
            <td className="col-del" />
          </tr>
        ),
      });
    }
  }

  const rows = realRows.concat(emptyRows).sort((a, b) => {
    if (a.tableOrder !== b.tableOrder) return a.tableOrder - b.tableOrder;
    if (a.tableKey !== b.tableKey) return a.tableKey.localeCompare(b.tableKey);
    const an = parseFloat(a.seatSort);
    const bn = parseFloat(b.seatSort);
    if (!isNaN(an) && !isNaN(bn)) return an - bn;
    return String(a.seatSort).localeCompare(String(b.seatSort));
  });

  const emptyMsg = guests.length === 0 ? t('noGuestData') : t('noGuestDataFiltered');

  return (
    <>
      <div className="stat-row" style={{ marginTop: 16 }}>
        <div className="stat"><div className="v">{guests.length}</div><div className="l">{t('statGuestsTotal')}</div></div>
        <div className="stat"><div className="v">{tableCount}</div><div className="l">{t('statTablesUsed')}</div></div>
        <div className={`stat${conflictGuestCount > 0 ? ' warn' : ''}`}><div className="v">{conflictGuestCount}</div><div className="l">{t('statSeatConflicts')}</div></div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="preview guest-table">
          <thead><tr><th>{t('thName')}</th><th>{t('thTable')}</th><th>{t('thSeat')}</th><th></th></tr></thead>
          <tbody>
            {rows.length ? rows.map((r) => r.node) : (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>{emptyMsg}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        className="chip"
        style={{ marginTop: 12 }}
        onClick={() => {
          const filterMatch = guestTableFilter && guestTableFilter !== '__other__' ? tables.find((tb) => tb.key === guestTableFilter) : null;
          dispatch({ type: 'SET_GUESTS', guests: [...guests, { name: '', table: filterMatch ? filterMatch.label : '', seat: '' }] });
          if (guestSearchQuery) dispatch({ type: 'SET_GUEST_SEARCH', query: '' });
        }}
      >
        {t('addGuestBtn')}
      </button>
    </>
  );
}
