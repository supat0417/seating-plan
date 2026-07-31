import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DICTIONARIES, type Dictionary, type Lang } from '../../domain/i18n';

interface I18nContextValue {
  lang: Lang;
  dict: Dictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<I18nContextValue>(() => ({ lang, dict: DICTIONARIES[lang] }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Mirrors the original's `t(key, ...args)` — returns the string as-is for plain keys, or
 * calls the function for parametrized keys. */
export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used within I18nProvider');
  const { dict, lang } = ctx;
  function t<K extends keyof Dictionary>(key: K, ...args: Dictionary[K] extends (...a: infer A) => string ? A : never[]): string {
    const v = dict[key];
    if (typeof v === 'function') return (v as (...a: unknown[]) => string)(...args);
    return v as string;
  }
  return { t, lang, dict };
}
