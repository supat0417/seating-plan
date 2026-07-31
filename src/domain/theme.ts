// Theme color system — ported 1:1 from seating-plan.html's applyPlanTheme/THEMES/theme* helpers.

export interface ThemePreset {
  id: string;
  nameTh: string;
  nameEn: string;
  colors: [string, string, string, string];
}

export interface CustomThemeColors {
  c60: string;
  c25: string;
  c10: string;
  c5: string;
}

export type ThemeSelection = string | null; // preset id, 'custom', or null (default)

export const THEMES: ThemePreset[] = [
  { id: 'rose', nameTh: 'โรสควอตซ์', nameEn: 'Rose Quartz', colors: ['#f9eaea', '#fbdcdd', '#f3c6c9', '#bbaad1'] },
  { id: 'sage', nameTh: 'เซจโทน', nameEn: 'Sage', colors: ['#e9f2de', '#92ae89', '#577864', '#37454f'] },
  { id: 'plum', nameTh: 'พลัมเบอร์รี่', nameEn: 'Plum Berry', colors: ['#6b3f69', '#8b5e8a', '#a87ca0', '#e0c3c5'] },
  { id: 'amber', nameTh: 'โกลด์เนวี่', nameEn: 'Gold Navy', colors: ['#ebac3b', '#3b6491', '#1f3a5a', '#4a7a8c'] },
];

export const DEFAULT_CUSTOM_COLORS: CustomThemeColors = { c60: '#f4f1ea', c25: '#8992a3', c10: '#c9a35e', c5: '#20242b' };

export function isHexColor(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
}

export function getPreset(id: string): ThemePreset | null {
  return THEMES.find((x) => x.id === id) || null;
}

export function getTheme(
  id: string,
  customColors: CustomThemeColors,
  customLabel: string
): ThemePreset & { custom?: true } {
  if (id === 'custom') {
    return {
      id: 'custom',
      custom: true,
      nameTh: customLabel,
      nameEn: customLabel,
      colors: [customColors.c60, customColors.c25, customColors.c10, customColors.c5],
    };
  }
  return getPreset(id) as ThemePreset & { custom?: true };
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function themeHexToRgb(hex: string): Rgb {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function themeRgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

export function themeMix(hexA: string, hexB: string, t: number): string {
  const a = themeHexToRgb(hexA);
  const b = themeHexToRgb(hexB);
  return themeRgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}

export function themeLighten(hex: string, amt: number): string {
  return themeMix(hex, '#ffffff', amt);
}
export function themeDarken(hex: string, amt: number): string {
  return themeMix(hex, '#000000', amt);
}
export function themeHexToRgba(hex: string, alpha: number): string {
  const c = themeHexToRgb(hex);
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}
export function themeLuminance(hex: string): number {
  const c = themeHexToRgb(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

export interface ThemeShades {
  light: string;
  soft: string;
  mid: string;
  deep: string;
}

export function themeShades(theme: { custom?: boolean; colors: [string, string, string, string] }): ThemeShades {
  if (theme.custom) {
    return { light: theme.colors[0], soft: theme.colors[1], mid: theme.colors[2], deep: theme.colors[3] };
  }
  const sorted = [...theme.colors].sort((a, b) => themeLuminance(b) - themeLuminance(a));
  return { light: sorted[0], soft: sorted[1], mid: sorted[2], deep: sorted[3] };
}

export function themeAdjustLuminance(hex: string, target: number): string {
  const lum = themeLuminance(hex);
  if (lum <= 0.01) return themeLighten(hex, Math.max(0, Math.min(1, target / 255)));
  if (lum > target) return themeDarken(hex, Math.max(0, Math.min(1, 1 - target / lum)));
  if (lum < target) return themeLighten(hex, Math.max(0, Math.min(1, (target - lum) / (255 - lum))));
  return hex;
}

/** The 14 CSS custom properties the editor app swaps at runtime. `null` means "remove the
 * overrides and fall back to the stylesheet's default :root values". */
export const PLAN_THEME_VARS = [
  '--cream', '--paper', '--paper-soft', '--navy', '--navy-deep', '--navy-soft',
  '--slate', '--slate-deep', '--slate-soft', '--gold', '--gold-deep', '--gold-soft',
  '--line', '--line-strong',
] as const;

export type PlanThemeTokens = Record<(typeof PLAN_THEME_VARS)[number], string>;

/** Pure port of applyPlanTheme's color math — returns the CSS var map instead of mutating
 * document.documentElement directly (the UI layer is responsible for applying it). */
export function computePlanThemeTokens(theme: { custom?: boolean; colors: [string, string, string, string] }): PlanThemeTokens {
  const s = themeShades(theme);
  const navy = themeAdjustLuminance(s.deep, 54);
  const navyDeep = themeAdjustLuminance(s.deep, 36);
  const slate = themeAdjustLuminance(s.soft, 112);
  const slateDeep = themeAdjustLuminance(s.soft, 88);
  const gold = themeAdjustLuminance(s.mid, 167);
  const goldDeep = themeAdjustLuminance(s.mid, 132);
  const line = themeMix(s.light, '#c7d0da', 0.55);
  return {
    '--cream': themeMix(s.light, '#ffffff', 0.5),
    '--paper': themeMix(s.light, '#ffffff', 0.85),
    '--paper-soft': themeMix(s.light, '#ffffff', 0.68),
    '--navy': navy,
    '--navy-deep': navyDeep,
    '--navy-soft': themeHexToRgba(navy, 0.06),
    '--slate': slate,
    '--slate-deep': slateDeep,
    '--slate-soft': themeHexToRgba(slate, 0.14),
    '--gold': gold,
    '--gold-deep': goldDeep,
    '--gold-soft': themeHexToRgba(gold, 0.22),
    '--line': line,
    '--line-strong': themeDarken(line, 0.12),
  };
}
