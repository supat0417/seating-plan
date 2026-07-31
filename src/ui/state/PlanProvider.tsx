import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { planReducer, type PlanAction } from '../../state/planReducer';
import { createInitialState, type PlanState } from '../../state/planState';
import { nextIdCounter } from '../../domain/jsonSchema';
import {
  loadFloorplan, saveFloorplan, loadGuests, saveGuests,
  loadTheme, saveTheme, loadCustomColors, saveCustomColors, clearAllPlanStorage,
} from '../../infrastructure/storage';
import { loadLang, saveLang } from '../../domain/i18n';
import { computePlanThemeTokens, getTheme, PLAN_THEME_VARS } from '../../domain/theme';
import { useT } from '../i18n/I18nContext';

interface PlanContextValue {
  state: PlanState;
  dispatch: Dispatch<PlanAction>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}

/** Must be rendered inside both PlanProvider AND I18nProvider (it needs state.lang-derived
 * translations for the document title / theme custom-label) — see App.tsx for wiring, since
 * I18nProvider itself needs state.lang from PlanProvider, creating an ordering dependency. */
export function PlanEffects() {
  const { state } = usePlan();
  const { t } = useT();

  // Apply theme CSS vars whenever theme selection or custom colors change.
  useEffect(() => {
    const root = document.documentElement.style;
    if (!state.theme) {
      PLAN_THEME_VARS.forEach((v) => root.removeProperty(v));
      return;
    }
    const theme = getTheme(state.theme, state.customColors, t('themeCustomLabel'));
    const tokens = computePlanThemeTokens(theme);
    (Object.entries(tokens) as Array<[string, string]>).forEach(([k, v]) => root.setProperty(k, v));
  }, [state.theme, state.customColors, t]);

  useEffect(() => {
    if (!state.hydrated) return;
    saveFloorplan(state.floorplan);
  }, [state.floorplan, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    saveGuests(state.guests);
  }, [state.guests, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    saveTheme(state.theme);
  }, [state.theme, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    saveCustomColors(state.customColors);
  }, [state.customColors, state.hydrated]);

  useEffect(() => {
    saveLang(state.lang);
    document.documentElement.lang = state.lang;
  }, [state.lang]);

  useEffect(() => {
    document.title = t('appTitle');
  }, [t]);

  // Warn on tab close if there's unsaved-to-file data (mirrors the original's beforeunload guard).
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (state.floorplan.length || state.guests.length) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state.floorplan.length, state.guests.length]);

  return null;
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(planReducer, undefined, () => createInitialState(loadLang()));

  useEffect(() => {
    const floorplan = loadFloorplan();
    const guests = loadGuests();
    const theme = loadTheme();
    const customColors = loadCustomColors(state.customColors);
    dispatch({ type: 'HYDRATE', floorplan, guests, theme, customColors, idCounter: nextIdCounter(floorplan) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <PlanContext.Provider value={{ state, dispatch }}>{children}</PlanContext.Provider>;
}

export function clearPlanCache(dispatch: Dispatch<PlanAction>) {
  clearAllPlanStorage();
  dispatch({ type: 'CLEAR_CACHE' });
}
