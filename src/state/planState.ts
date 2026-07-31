import type { FloorplanObject, ObjectType } from '../domain/floorplan';
import type { Guest } from '../domain/guest';
import type { CustomThemeColors } from '../domain/theme';
import { DEFAULT_CUSTOM_COLORS } from '../domain/theme';
import type { Lang } from '../domain/i18n';

export type Mode = 'edit' | 'guests' | 'view';

export interface PlanState {
  floorplan: FloorplanObject[];
  guests: Guest[];
  selectedIds: string[];
  mode: Mode;
  idCounter: number;
  theme: string | null; // preset id, 'custom', or null (default)
  customColors: CustomThemeColors;
  lang: Lang;
  clipboard: FloorplanObject[] | null;
  undoStack: string[];
  redoStack: string[];
  guestTableFilter: string | null;
  guestSearchQuery: string;
  hydrated: boolean;
}

export function createInitialState(lang: Lang): PlanState {
  return {
    floorplan: [],
    guests: [],
    selectedIds: [],
    mode: 'edit',
    idCounter: 1,
    theme: null,
    customColors: { ...DEFAULT_CUSTOM_COLORS },
    lang,
    clipboard: null,
    undoStack: [],
    redoStack: [],
    guestTableFilter: null,
    guestSearchQuery: '',
    hydrated: false,
  };
}

export interface Snapshot {
  floorplan: FloorplanObject[];
  guests: Guest[];
}

export function snapshotOf(state: PlanState): string {
  return JSON.stringify({ floorplan: state.floorplan, guests: state.guests });
}

export function nextObjectId(counter: number): string {
  return 't' + counter;
}

export type ObjectTypeOrAll = ObjectType;
