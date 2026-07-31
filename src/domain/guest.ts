// Guest data model + table/roster/conflict logic — ported 1:1 from seating-plan.html.
import type { FloorplanObject } from './floorplan';
import { normTable } from './floorplan';

export interface Guest {
  name: string;
  table: string;
  seat: string;
}

export interface SeatRosterRow {
  seat: string;
  name: string;
  empty: boolean;
}

export type TableStatus = 'nocap' | 'empty' | 'partial' | 'full' | 'over';

export function seatSortCompare(a: Guest, b: Guest): number {
  const an = parseFloat(a.seat);
  const bn = parseFloat(b.seat);
  if (!isNaN(an) && !isNaN(bn)) return an - bn;
  return String(a.seat).localeCompare(String(b.seat));
}

export function guestsForTable(guests: Guest[], tableLabel: string): Guest[] {
  return guests.filter((g) => normTable(g.table) === normTable(tableLabel)).sort(seatSortCompare);
}

export function seatRosterForTable(
  guests: Guest[],
  table: { label: string; capacity: number }
): SeatRosterRow[] {
  const assigned = guestsForTable(guests, table.label);
  const capacity = table.capacity || 0;
  if (capacity <= 0) return assigned.map((g) => ({ seat: g.seat, name: g.name, empty: false }));

  const bySeat: Record<string, Guest[]> = {};
  assigned.forEach((g) => {
    const key = String(g.seat || '').trim();
    if (!bySeat[key]) bySeat[key] = [];
    bySeat[key].push(g);
  });

  const rows: SeatRosterRow[] = [];
  const usedKeys = new Set<string>();
  for (let s = 1; s <= capacity; s++) {
    const key = String(s);
    usedKeys.add(key);
    if (bySeat[key] && bySeat[key].length) {
      bySeat[key].forEach((g) => rows.push({ seat: key, name: g.name, empty: false }));
    } else {
      rows.push({ seat: key, name: '', empty: true });
    }
  }
  assigned.forEach((g) => {
    const key = String(g.seat || '').trim();
    if (!usedKeys.has(key)) rows.push({ seat: g.seat, name: g.name, empty: false });
  });
  return rows;
}

export function seatConflictKey(g: Guest): string | null {
  const table = normTable(g.table);
  const seat = String(g.seat || '').trim().toLowerCase();
  return table && seat ? `${table}|${seat}` : null;
}

export function seatConflictCounts(guests: Guest[]): Record<string, number> {
  const counts: Record<string, number> = {};
  guests.forEach((g) => {
    const key = seatConflictKey(g);
    if (key) counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

export interface FloorplanTableRef {
  key: string;
  label: string;
  capacity: number;
}

export function floorplanTables(floorplan: FloorplanObject[]): FloorplanTableRef[] {
  return floorplan
    .filter((o) => o.type === 'round' || o.type === 'long')
    .map((o) => ({ key: normTable(o.label), label: o.label, capacity: o.capacity }));
}

export function tableStatus(count: number, capacity: number): TableStatus {
  if (capacity <= 0) return 'nocap';
  if (count === 0) return 'empty';
  if (count > capacity) return 'over';
  if (count === capacity) return 'full';
  return 'partial';
}
