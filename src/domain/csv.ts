// Hand-rolled CSV parser/builder — ported 1:1 from seating-plan.html (parseCSV/csvField/
// exportGuestTemplate). No library dependency, matches the original's bilingual
// header-detection heuristics exactly.
import type { Guest } from './guest';
import type { FloorplanObject } from './floorplan';

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === delim && !inQ) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseCSV(text: string): Guest[] {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  let delim = ',';
  if (lines[0].includes('\t')) delim = '\t';
  else if (!lines[0].includes(',') && lines[0].includes(';')) delim = ';';

  const header = splitLine(lines[0], delim).map((h) => h.toLowerCase());
  let nameIdx = header.findIndex((h) => h.includes('ชื่อ') || h.includes('name'));
  let tableIdx = header.findIndex((h) => h.includes('โต๊ะ') || h.includes('table'));
  let seatIdx = header.findIndex((h) => h.includes('นั่ง') || h.includes('seat'));
  if (nameIdx === -1) nameIdx = 0;
  if (tableIdx === -1) tableIdx = 1;
  if (seatIdx === -1) seatIdx = 2;

  // A header row's cells are text labels; a real data row almost always has at least one
  // purely-numeric cell (typically the seat number). Use that to decide whether row 0 is a
  // header, instead of relying only on recognizing specific keyword wording.
  const looksLikeDataRow = header.some((cell) => cell !== '' && isFinite(Number(cell)));
  const startRow = looksLikeDataRow ? 0 : 1;

  const rows: Guest[] = [];
  for (let i = startRow; i < lines.length; i++) {
    const cols = splitLine(lines[i], delim);
    if (cols.length < 3 && !(cols[nameIdx] && cols[tableIdx])) continue;
    const name = cols[nameIdx] || '';
    const table = cols[tableIdx] || '';
    const seat = cols[seatIdx] || '';
    if (!name) continue;
    rows.push({ name, table, seat });
  }
  return rows;
}

export function csvField(v: unknown): string {
  const s = String(v == null ? '' : v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Builds the guest-template CSV text (UTF-8 BOM prepended by the caller on download) for
 * every seat of every capacity>0 round/long table. Returns null if there are no such tables. */
export function buildGuestTemplateCsv(
  floorplan: FloorplanObject[],
  headers: { name: string; table: string; seat: string }
): { csv: string; rowCount: number } | null {
  const tables = floorplan.filter((o) => (o.type === 'round' || o.type === 'long') && o.capacity > 0);
  if (tables.length === 0) return null;
  const rows: string[][] = [[headers.name, headers.table, headers.seat]];
  tables.forEach((tb) => {
    for (let i = 1; i <= tb.capacity; i++) {
      rows.push(['', tb.label, String(i)]);
    }
  });
  const csv = rows.map((r) => r.map(csvField).join(',')).join('\r\n');
  return { csv, rowCount: rows.length - 1 };
}
