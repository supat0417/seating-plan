import { describe, expect, it } from 'vitest';
import { CANVAS_W, CANVAS_H, DEFAULTS, findSnap, seatPositions, snapRotation, unrotateDelta, applyResizeDelta } from '../floorplan';
import { seatConflictCounts, seatRosterForTable, tableStatus, guestsForTable } from '../guest';
import { THEMES, computePlanThemeTokens, themeLuminance, isHexColor } from '../theme';
import { parseCSV, buildGuestTemplateCsv } from '../csv';
import { parseImportJson, resolveImportedTheme } from '../jsonSchema';
import { DICTIONARIES } from '../i18n';

describe('constants', () => {
  it('matches the original canvas size', () => {
    expect(CANVAS_W).toBe(1400);
    expect(CANVAS_H).toBe(900);
  });
  it('has the original per-type defaults', () => {
    expect(DEFAULTS.round).toEqual({ w: 120, h: 120, capacity: 10 });
    expect(DEFAULTS.long).toEqual({ w: 220, h: 70, capacity: 10 });
    expect(DEFAULTS.stage).toEqual({ w: 260, h: 90, capacity: 0 });
    expect(DEFAULTS.door).toEqual({ w: 60, h: 20, capacity: 0 });
  });
});

describe('seatPositions', () => {
  it('places round-table seats evenly around a circle starting at the top', () => {
    const pts = seatPositions('round', 120, 120, 4);
    expect(pts).toHaveLength(4);
    // first seat is at angle -90deg (top center): x=w/2, y=h/2-r
    const r = 120 / 2 + 10;
    expect(pts[0].x).toBeCloseTo(60 - 3.5, 5);
    expect(pts[0].y).toBeCloseTo(60 - r - 3.5, 5);
  });
  it('splits long-table seats into two rows', () => {
    const pts = seatPositions('long', 220, 70, 6);
    expect(pts).toHaveLength(6);
    expect(pts[0].y).toBeCloseTo(-10, 5);
    expect(pts[3].y).toBeCloseTo(73, 5);
  });
  it('returns nothing for zero capacity', () => {
    expect(seatPositions('round', 100, 100, 0)).toEqual([]);
  });
});

describe('snapRotation', () => {
  it('snaps within 5 degrees to the nearest right angle', () => {
    expect(snapRotation(88)).toEqual({ deg: 90, snapped: true });
    expect(snapRotation(357)).toEqual({ deg: 0, snapped: true });
  });
  it('does not snap when far from a right angle', () => {
    const r = snapRotation(45);
    expect(r.snapped).toBe(false);
    expect(r.deg).toBe(45);
  });
});

describe('findSnap', () => {
  it('snaps to the canvas center', () => {
    const s = findSnap(CANVAS_W / 2 - 50 + 3, 400, 100, 100, []);
    expect(s.guideV).toBe(CANVAS_W / 2);
  });
  it('snaps to another object center', () => {
    const other = { id: 'x', type: 'round' as const, x: 200, y: 200, w: 100, h: 100, rot: 0, label: '', capacity: 0 };
    const s = findSnap(198, 300, 100, 100, [other]);
    expect(s.guideV).toBe(250);
  });
});

describe('resize math', () => {
  it('un-rotates a delta at 90 degrees', () => {
    const { dx, dy } = unrotateDelta(10, 0, 90);
    expect(dx).toBeCloseTo(0, 5);
    expect(dy).toBeCloseTo(-10, 5);
  });
  it('resizes round tables uniformly', () => {
    const r = applyResizeDelta('round', 100, 100, 20, 10);
    expect(r.w).toBe(r.h);
    expect(r.w).toBe(115);
  });
  it('resizes long tables independently and clamps to DIM_MAX', () => {
    const r = applyResizeDelta('long', 590, 100, 50, 5);
    expect(r.w).toBe(600);
    expect(r.h).toBe(105);
  });
});

describe('guest/table logic', () => {
  const guests = [
    { name: 'A', table: 'Table 1', seat: '1' },
    { name: 'B', table: 'table 1', seat: '2' },
    { name: 'C', table: 'Table 1', seat: '2' }, // conflict with B
  ];
  it('matches tables case/whitespace-insensitively', () => {
    expect(guestsForTable(guests, ' TABLE 1 ')).toHaveLength(3);
  });
  it('detects seat conflicts', () => {
    const counts = seatConflictCounts(guests);
    expect(counts['table 1|2']).toBe(2);
  });
  it('pads the roster to capacity with empty seats and appends overflow', () => {
    const rows = seatRosterForTable(guests, { label: 'Table 1', capacity: 2 });
    expect(rows.filter((r) => r.empty)).toHaveLength(0);
    expect(rows).toHaveLength(3); // seat1, seat2(x2 - both at seat "2")
  });
  it('classifies table status', () => {
    expect(tableStatus(0, 10)).toBe('empty');
    expect(tableStatus(5, 10)).toBe('partial');
    expect(tableStatus(10, 10)).toBe('full');
    expect(tableStatus(12, 10)).toBe('over');
    expect(tableStatus(0, 0)).toBe('nocap');
  });
});

describe('theme system', () => {
  it('has 4 presets with 4 hex colors each', () => {
    expect(THEMES).toHaveLength(4);
    THEMES.forEach((t) => {
      expect(t.colors).toHaveLength(4);
      t.colors.forEach((c) => expect(isHexColor(c)).toBe(true));
    });
  });
  it('produces stable, valid CSS token output for every preset', () => {
    THEMES.forEach((theme) => {
      const tokens = computePlanThemeTokens(theme);
      expect(Object.keys(tokens)).toHaveLength(14);
      expect(tokens['--navy']).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
  it('computes luminance consistently', () => {
    expect(themeLuminance('#ffffff')).toBeCloseTo(255, 0);
    expect(themeLuminance('#000000')).toBe(0);
  });
});

describe('CSV', () => {
  it('parses comma-delimited data with a bilingual header', () => {
    const csv = 'ชื่อ-นามสกุล,โต๊ะ,เลขที่นั่ง\nสมชาย,Table 1,1\n,Table 1,2\n';
    const rows = parseCSV(csv);
    expect(rows).toEqual([{ name: 'สมชาย', table: 'Table 1', seat: '1' }]);
  });
  it('auto-detects tab delimiter', () => {
    const csv = 'name\ttable\tseat\nAlice\tT1\t1\n';
    const rows = parseCSV(csv);
    expect(rows).toEqual([{ name: 'Alice', table: 'T1', seat: '1' }]);
  });
  it('builds a template CSV with a blank-name row per seat', () => {
    const floorplan = [{ id: 't1', type: 'round' as const, x: 0, y: 0, w: 120, h: 120, rot: 0, label: 'Table 1', capacity: 2 }];
    const result = buildGuestTemplateCsv(floorplan, { name: 'Name', table: 'Table', seat: 'Seat' });
    expect(result?.rowCount).toBe(2);
    expect(result?.csv).toContain('Name,Table,Seat');
  });
  it('returns null when there are no capacity>0 tables', () => {
    expect(buildGuestTemplateCsv([], { name: 'a', table: 'b', seat: 'c' })).toBeNull();
  });
});

describe('JSON import/export schema', () => {
  it('accepts a bare-array legacy floorplan import', () => {
    const raw = JSON.stringify([{ id: 't1', type: 'round', x: 0, y: 0, w: 120, h: 120, rot: 0, label: 'A', capacity: 4 }]);
    const parsed = parseImportJson(raw);
    expect('error' in parsed).toBe(false);
    if (!('error' in parsed)) {
      expect(parsed.floorplanRaw).toHaveLength(1);
      expect(parsed.guestsRaw).toBeNull();
    }
  });
  it('rejects invalid JSON', () => {
    expect(parseImportJson('{not json')).toEqual({ error: 'badJson' });
  });
  it('rejects a floorplan item missing required fields', () => {
    const raw = JSON.stringify({ floorplan: [{ id: 't1' }] });
    expect(parseImportJson(raw)).toEqual({ error: 'badFloorplan' });
  });
  it('resolves a custom theme object', () => {
    const r = resolveImportedTheme({ id: 'custom', colors: ['#111111', '#222222', '#333333', '#444444'] });
    expect(r).toEqual({ kind: 'custom', colors: { c60: '#111111', c25: '#222222', c10: '#333333', c5: '#444444' } });
  });
  it('resolves a preset theme string', () => {
    expect(resolveImportedTheme('sage')).toEqual({ kind: 'preset', id: 'sage' });
  });
  it('falls back to default for anything else', () => {
    expect(resolveImportedTheme(null)).toEqual({ kind: 'default' });
  });
});

describe('i18n dictionary parity', () => {
  it('th and en have identical key sets', () => {
    const thKeys = Object.keys(DICTIONARIES.th).sort();
    const enKeys = Object.keys(DICTIONARIES.en).sort();
    expect(thKeys).toEqual(enKeys);
  });
});
