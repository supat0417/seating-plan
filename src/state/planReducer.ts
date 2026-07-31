import { CANVAS_H, CANVAS_W, type FloorplanObject } from '../domain/floorplan';
import type { Guest } from '../domain/guest';
import { DEFAULT_CUSTOM_COLORS, type CustomThemeColors } from '../domain/theme';
import type { Lang } from '../domain/i18n';
import { nextIdCounter } from '../domain/jsonSchema';
import { createInitialState, nextObjectId, snapshotOf, type Mode, type PlanState } from './planState';

const UNDO_CAP = 50;

export type PlanAction =
  | { type: 'HYDRATE'; floorplan: FloorplanObject[]; guests: Guest[]; theme: string | null; customColors: CustomThemeColors; idCounter: number }
  | { type: 'ADD_OBJECT'; object: FloorplanObject }
  | { type: 'DELETE_OBJECTS'; ids: string[] }
  | { type: 'MOVE_OBJECTS'; changes: Array<{ id: string; x: number; y: number }> }
  | { type: 'RESIZE_OBJECT'; id: string; w: number; h: number }
  | { type: 'ROTATE_OBJECT'; id: string; rot: number }
  | { type: 'UPDATE_OBJECT_FIELDS'; id: string; fields: Partial<FloorplanObject> }
  | { type: 'SET_SELECTION'; ids: string[] }
  | { type: 'COPY_SELECTION' }
  | { type: 'PASTE_CLIPBOARD' }
  | { type: 'SET_GUESTS'; guests: Guest[] }
  | { type: 'ADD_GUEST' }
  | { type: 'UPDATE_GUEST'; index: number; fields: Partial<Guest> }
  | { type: 'DELETE_GUEST'; index: number }
  | { type: 'IMPORT_DATA'; floorplan?: FloorplanObject[]; guests?: Guest[] }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'SET_THEME'; theme: string | null }
  | { type: 'SET_CUSTOM_COLOR'; slot: keyof CustomThemeColors; hex: string }
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'SET_GUEST_FILTER'; filter: string | null }
  | { type: 'SET_GUEST_SEARCH'; query: string }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function withUndo(state: PlanState): Pick<PlanState, 'undoStack' | 'redoStack'> {
  const stack = [...state.undoStack, snapshotOf(state)];
  if (stack.length > UNDO_CAP) stack.shift();
  return { undoStack: stack, redoStack: [] };
}

export function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        floorplan: action.floorplan,
        guests: action.guests,
        theme: action.theme,
        customColors: action.customColors,
        idCounter: action.idCounter,
        hydrated: true,
      };

    case 'ADD_OBJECT':
      return {
        ...state,
        ...withUndo(state),
        floorplan: [...state.floorplan, action.object],
        idCounter: state.idCounter + 1,
        selectedIds: [action.object.id],
      };

    case 'DELETE_OBJECTS': {
      const idSet = new Set(action.ids);
      return {
        ...state,
        ...withUndo(state),
        floorplan: state.floorplan.filter((o) => !idSet.has(o.id)),
        selectedIds: state.selectedIds.filter((id) => !idSet.has(id)),
      };
    }

    case 'MOVE_OBJECTS': {
      const byId = new Map(action.changes.map((c) => [c.id, c]));
      return {
        ...state,
        ...withUndo(state),
        floorplan: state.floorplan.map((o) => {
          const c = byId.get(o.id);
          return c ? { ...o, x: c.x, y: c.y } : o;
        }),
      };
    }

    case 'RESIZE_OBJECT':
      return {
        ...state,
        ...withUndo(state),
        floorplan: state.floorplan.map((o) => (o.id === action.id ? { ...o, w: action.w, h: action.h } : o)),
      };

    case 'ROTATE_OBJECT':
      return {
        ...state,
        ...withUndo(state),
        floorplan: state.floorplan.map((o) => (o.id === action.id ? { ...o, rot: action.rot } : o)),
      };

    case 'UPDATE_OBJECT_FIELDS':
      return {
        ...state,
        ...withUndo(state),
        floorplan: state.floorplan.map((o) => (o.id === action.id ? { ...o, ...action.fields } : o)),
      };

    case 'SET_SELECTION':
      return { ...state, selectedIds: action.ids };

    case 'COPY_SELECTION': {
      const selected = state.floorplan.filter((o) => state.selectedIds.includes(o.id));
      if (!selected.length) return state;
      return { ...state, clipboard: selected.map((o) => ({ ...o })) };
    }

    case 'PASTE_CLIPBOARD': {
      if (!state.clipboard || !state.clipboard.length) return state;
      let counter = state.idCounter;
      const pasted: FloorplanObject[] = state.clipboard.map((c) => {
        const x = Math.max(0, Math.min(CANVAS_W - c.w, c.x + 24));
        const y = Math.max(0, Math.min(CANVAS_H - c.h, c.y + 24));
        const obj: FloorplanObject = { ...c, id: nextObjectId(counter), x, y };
        counter += 1;
        return obj;
      });
      return {
        ...state,
        ...withUndo(state),
        floorplan: [...state.floorplan, ...pasted],
        idCounter: counter,
        selectedIds: pasted.map((o) => o.id),
      };
    }

    case 'SET_GUESTS':
      return { ...state, ...withUndo(state), guests: action.guests };

    case 'ADD_GUEST':
      return { ...state, ...withUndo(state), guests: [...state.guests, { name: '', table: '', seat: '' }] };

    case 'UPDATE_GUEST':
      return {
        ...state,
        ...withUndo(state),
        guests: state.guests.map((g, i) => (i === action.index ? { ...g, ...action.fields } : g)),
      };

    case 'DELETE_GUEST':
      return { ...state, ...withUndo(state), guests: state.guests.filter((_, i) => i !== action.index) };

    case 'IMPORT_DATA': {
      const floorplan = action.floorplan ?? state.floorplan;
      return {
        ...state,
        ...withUndo(state),
        floorplan,
        guests: action.guests ?? state.guests,
        idCounter: action.floorplan ? nextIdCounter(floorplan) : state.idCounter,
        selectedIds: [],
      };
    }

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'SET_CUSTOM_COLOR':
      return {
        ...state,
        theme: 'custom',
        customColors: { ...state.customColors, [action.slot]: action.hex },
      };

    case 'SET_LANG':
      return { ...state, lang: action.lang };

    case 'SET_GUEST_FILTER':
      return { ...state, guestTableFilter: action.filter };

    case 'SET_GUEST_SEARCH':
      return { ...state, guestSearchQuery: action.query };

    case 'CLEAR_CACHE': {
      const fresh = createInitialState(state.lang);
      return { ...fresh, hydrated: true };
    }

    case 'UNDO': {
      if (!state.undoStack.length) return state;
      const snap = JSON.parse(state.undoStack[state.undoStack.length - 1]) as { floorplan: FloorplanObject[]; guests: Guest[] };
      return {
        ...state,
        floorplan: snap.floorplan,
        guests: snap.guests,
        selectedIds: [],
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, snapshotOf(state)],
      };
    }

    case 'REDO': {
      if (!state.redoStack.length) return state;
      const snap = JSON.parse(state.redoStack[state.redoStack.length - 1]) as { floorplan: FloorplanObject[]; guests: Guest[] };
      return {
        ...state,
        floorplan: snap.floorplan,
        guests: snap.guests,
        selectedIds: [],
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, snapshotOf(state)],
      };
    }

    default:
      return state;
  }
}

export { DEFAULT_CUSTOM_COLORS };
