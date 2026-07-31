import type { Dictionary, Lang } from './types';
import th from './th';
import en from './en';

export type { Dictionary, Lang } from './types';

export const DICTIONARIES: Record<Lang, Dictionary> = { th, en };

export const LANG_STORAGE_KEY = 'seating-plan-lang';

export function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'th') return saved;
  } catch {
    /* ignore */
  }
  return 'th';
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}
