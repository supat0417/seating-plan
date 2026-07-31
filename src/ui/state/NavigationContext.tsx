import { createContext, useContext, useRef, type ReactNode } from 'react';

interface NavigationContextValue {
  consumePendingHighlight: () => string | null;
  requestHighlight: (tableLabel: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}

/** Bridges the global search popover (any tab) to the View tab: clicking a result switches
 * to View mode and highlights that guest's table, mirroring the original's synchronous
 * `switchMode('view'); highlightTable(g.table);` — since our View tab mounts asynchronously
 * after the mode-switch render, we stash the pending table label here for the View tab's
 * mount effect to pick up once, instead of a render-cycle-dependent direct call. */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const pending = useRef<string | null>(null);

  function requestHighlight(tableLabel: string) {
    pending.current = tableLabel;
  }
  function consumePendingHighlight(): string | null {
    const v = pending.current;
    pending.current = null;
    return v;
  }

  return <NavigationContext.Provider value={{ consumePendingHighlight, requestHighlight }}>{children}</NavigationContext.Provider>;
}
