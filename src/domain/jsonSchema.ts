// JSON export/import schema + validation — ported 1:1 from seating-plan.html's
// exportAll/importAllFile. Pure functions only; the UI layer owns file IO, confirm()
// dialogs, and applying the result to state.
import { CAP_MIN, CAP_MAX, DEFAULTS, DIM_MIN, DIM_MAX, clampNum, type FloorplanObject, type ObjectType } from './floorplan';
import type { Guest } from './guest';
import { isHexColor, type CustomThemeColors } from './theme';

export type ExportedTheme = string | { id: 'custom'; colors: [string, string, string, string] } | null;

export interface SeatingDataFile {
  version: 2;
  exportedAt: string;
  theme: ExportedTheme;
  lang: 'th' | 'en';
  floorplan: FloorplanObject[];
  guests: Guest[];
}

export function buildExportData(input: {
  floorplan: FloorplanObject[];
  guests: Guest[];
  theme: ExportedTheme;
  lang: 'th' | 'en';
}): SeatingDataFile {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    theme: input.theme,
    lang: input.lang,
    floorplan: input.floorplan,
    guests: input.guests,
  };
}

export interface ParsedImport {
  floorplanRaw: unknown[] | null;
  guestsRaw: unknown[] | null;
  theme: ExportedTheme | undefined; // undefined = key absent entirely
}

export type ImportParseError = 'badJson' | 'noData' | 'badFloorplan' | 'badGuest';

/** Mirrors importAllFile's validation cascade exactly, without any DOM/alert/confirm side
 * effects — the caller maps each error code to a translated alert message. */
export function parseImportJson(raw: string): ParsedImport | { error: ImportParseError } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'badJson' };
  }
  const isBareArray = Array.isArray(parsed);
  const obj = isBareArray ? null : (parsed as Record<string, unknown>);
  const fpArr = isBareArray ? (parsed as unknown[]) : (obj!.floorplan as unknown[] | undefined);
  const gArr = isBareArray ? null : (obj!.guests as unknown[] | undefined);

  if (!Array.isArray(fpArr) && !Array.isArray(gArr)) return { error: 'noData' };

  if (Array.isArray(fpArr)) {
    const valid = fpArr.every(
      (o) =>
        o &&
        typeof o === 'object' &&
        (o as any).id &&
        DEFAULTS[(o as any).type as ObjectType] &&
        typeof (o as any).x === 'number' &&
        typeof (o as any).y === 'number'
    );
    if (!valid) return { error: 'badFloorplan' };
  }
  if (Array.isArray(gArr)) {
    const valid = gArr.every((g) => g && typeof g === 'object');
    if (!valid) return { error: 'badGuest' };
  }

  return {
    floorplanRaw: Array.isArray(fpArr) ? fpArr : null,
    guestsRaw: Array.isArray(gArr) ? gArr : null,
    theme: !isBareArray && obj && 'theme' in obj ? (obj.theme as ExportedTheme) : undefined,
  };
}

export function normalizeImportedFloorplan(raw: unknown[]): FloorplanObject[] {
  return raw.map((o) => {
    const r = o as any;
    const type = r.type as ObjectType;
    const d = DEFAULTS[type];
    return {
      id: String(r.id),
      type,
      x: Number(r.x) || 0,
      y: Number(r.y) || 0,
      w: clampNum(Number(r.w) || (d ? d.w : 100), DIM_MIN, DIM_MAX),
      h: clampNum(Number(r.h) || (d ? d.h : 100), DIM_MIN, DIM_MAX),
      rot: Number(r.rot) || 0,
      label: r.label || '',
      capacity: clampNum(Number(r.capacity) || 0, CAP_MIN, CAP_MAX),
    };
  });
}

export function nextIdCounter(floorplan: FloorplanObject[]): number {
  return floorplan.reduce((m, o) => Math.max(m, parseInt(o.id.replace('t', ''), 10) || 0), 0) + 1;
}

export function normalizeImportedGuests(raw: unknown[]): Guest[] {
  return raw.map((g) => {
    const r = g as any;
    return { name: String(r.name || ''), table: String(r.table || ''), seat: String(r.seat || '') };
  });
}

export type ResolvedImportedTheme =
  | { kind: 'custom'; colors: CustomThemeColors }
  | { kind: 'preset'; id: string }
  | { kind: 'default' };

/** Mirrors the `'theme' in parsed` branch of importAllFile: a valid custom-colors object wins,
 * a string is treated as a preset id, anything else falls back to the default theme. */
export function resolveImportedTheme(theme: ExportedTheme): ResolvedImportedTheme {
  if (theme && typeof theme === 'object' && theme.id === 'custom' && Array.isArray(theme.colors) && theme.colors.length === 4 && theme.colors.every(isHexColor)) {
    const [c60, c25, c10, c5] = theme.colors;
    return { kind: 'custom', colors: { c60, c25, c10, c5 } };
  }
  return typeof theme === 'string' ? { kind: 'preset', id: theme } : { kind: 'default' };
}
