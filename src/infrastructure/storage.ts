// Typed localStorage wrappers for the exact keys the original seating-plan.html used.
import type { FloorplanObject } from '../domain/floorplan';
import type { Guest } from '../domain/guest';
import { isHexColor, type CustomThemeColors } from '../domain/theme';

const FLOORPLAN_KEY = 'floorplan-v1';
const GUESTS_KEY = 'guests-v1';
const THEME_KEY = 'seating-plan-theme';
const CUSTOM_THEME_KEY = 'seating-plan-custom-theme';

export function loadFloorplan(): FloorplanObject[] {
  try {
    const raw = localStorage.getItem(FLOORPLAN_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveFloorplan(floorplan: FloorplanObject[]): void {
  try {
    localStorage.setItem(FLOORPLAN_KEY, JSON.stringify(floorplan));
  } catch {
    /* ignore */
  }
}

export function loadGuests(): Guest[] {
  try {
    const raw = localStorage.getItem(GUESTS_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveGuests(guests: Guest[]): void {
  try {
    localStorage.setItem(GUESTS_KEY, JSON.stringify(guests));
  } catch {
    /* ignore */
  }
}

export function loadTheme(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function saveTheme(theme: string | null): void {
  try {
    if (theme) localStorage.setItem(THEME_KEY, theme);
    else localStorage.removeItem(THEME_KEY);
  } catch {
    /* ignore */
  }
}

export function loadCustomColors(fallback: CustomThemeColors): CustomThemeColors {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_KEY);
    if (raw) {
      const v = JSON.parse(raw);
      if (v && isHexColor(v.c60) && isHexColor(v.c25) && isHexColor(v.c10) && isHexColor(v.c5)) {
        return { c60: v.c60, c25: v.c25, c10: v.c10, c5: v.c5 };
      }
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function saveCustomColors(colors: CustomThemeColors): void {
  try {
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(colors));
  } catch {
    /* ignore */
  }
}

export function clearAllPlanStorage(): void {
  try {
    localStorage.removeItem(FLOORPLAN_KEY);
    localStorage.removeItem(GUESTS_KEY);
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(CUSTOM_THEME_KEY);
  } catch {
    /* ignore */
  }
}
