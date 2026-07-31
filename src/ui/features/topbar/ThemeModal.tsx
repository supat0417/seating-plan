import { useState } from 'react';
import { usePlan } from '../../state/PlanProvider';
import { useT } from '../../i18n/I18nContext';
import { ModalBackdrop, ModalCloseButton } from '../../components/Modal';
import { StatusFullIcon } from '../../components/Icons';
import {
  THEMES, getTheme, isHexColor, themeAdjustLuminance, themeMix,
  type CustomThemeColors,
} from '../../../domain/theme';

const CUSTOM_THEME_SLOTS: Array<{ slot: keyof CustomThemeColors; pct: string; roleKey: 'themeRoleDominant' | 'themeRoleSecondary' | 'themeRoleAccent' | 'themeRoleInk' }> = [
  { slot: 'c60', pct: '60%', roleKey: 'themeRoleDominant' },
  { slot: 'c25', pct: '25%', roleKey: 'themeRoleSecondary' },
  { slot: 'c10', pct: '10%', roleKey: 'themeRoleAccent' },
  { slot: 'c5', pct: '5%', roleKey: 'themeRoleInk' },
];

function customSlotAppliedColor(slot: keyof CustomThemeColors, colors: CustomThemeColors): string {
  const hex = colors[slot];
  if (slot === 'c60') return themeMix(hex, '#ffffff', 0.85);
  if (slot === 'c25') return themeAdjustLuminance(hex, 112);
  if (slot === 'c10') return themeAdjustLuminance(hex, 167);
  return themeAdjustLuminance(hex, 54);
}

export function ThemeModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = usePlan();
  const { t, lang } = useT();
  const [hexDraft, setHexDraft] = useState<Record<string, string>>({});
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});

  function selectTheme(id: string | null) {
    dispatch({ type: 'SET_THEME', theme: id });
  }

  function commitColor(slot: keyof CustomThemeColors, hex: string) {
    dispatch({ type: 'SET_CUSTOM_COLOR', slot, hex });
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal modal-theme">
        <div className="modal-theme-head">
          <div>
            <h3>{t('themeModalTitle')}</h3>
            <div className="cap">{t('themeModalSubtitle')}</div>
          </div>
          <ModalCloseButton onClose={onClose} label={t('modalCloseLabel')} />
        </div>
        <div className="modal-theme-body">
          <div className="theme-grid">
            {THEMES.map((theme) => {
              const active = state.theme === theme.id;
              const name = lang === 'th' ? theme.nameTh : theme.nameEn;
              return (
                <button key={theme.id} className={`theme-card${active ? ' active' : ''}`} type="button" onClick={() => selectTheme(theme.id)}>
                  <div className="theme-swatch">
                    {theme.colors.map((c, i) => <span key={i} style={{ background: c }} />)}
                  </div>
                  <div className="theme-card-label">
                    <span>{name}</span>
                    <span className="theme-card-check"><StatusFullIcon size={12} /></span>
                  </div>
                </button>
              );
            })}
            <button className={`theme-card${state.theme === 'custom' ? ' active' : ''}`} type="button" onClick={() => selectTheme('custom')}>
              <div className="theme-swatch">
                <span style={{ flex: 60, background: state.customColors.c60 }} />
                <span style={{ flex: 25, background: state.customColors.c25 }} />
                <span style={{ flex: 10, background: state.customColors.c10 }} />
                <span style={{ flex: 5, background: state.customColors.c5 }} />
              </div>
              <div className="theme-card-label">
                <span>{t('themeCustomLabel')}</span>
                <span className="theme-card-check"><StatusFullIcon size={12} /></span>
              </div>
            </button>
            <button className={`theme-card reset${state.theme ? '' : ' active'}`} type="button" onClick={() => selectTheme(null)}>
              <div className="theme-swatch" />
              <div className="theme-card-label">
                <span>{t('themeDefaultLabel')}</span>
                <span className="theme-card-check"><StatusFullIcon size={12} /></span>
              </div>
            </button>
          </div>

          <div className="theme-custom-editor">
            <div className="theme-custom-title">{t('themeCustomEditorTitle')}</div>
            <div className="hint" style={{ margin: '0 0 4px' }}>{t('themeCustomEditorHint')}</div>
            {CUSTOM_THEME_SLOTS.map((s) => {
              const draft = hexDraft[s.slot] ?? state.customColors[s.slot];
              return (
                <div className="theme-custom-row" key={s.slot}>
                  <span className="tcr-pct">{s.pct}</span>
                  <span className="tcr-role">{t(s.roleKey)}</span>
                  <input
                    type="color"
                    className="tcr-swatch"
                    value={state.customColors[s.slot]}
                    onChange={(e) => {
                      setHexDraft((d) => ({ ...d, [s.slot]: e.target.value }));
                      setInvalid((d) => ({ ...d, [s.slot]: false }));
                      commitColor(s.slot, e.target.value);
                    }}
                  />
                  <input
                    type="text"
                    className={`tcr-hex${invalid[s.slot] ? ' invalid' : ''}`}
                    maxLength={7}
                    spellCheck={false}
                    value={draft}
                    onChange={(e) => {
                      let v = e.target.value.trim();
                      if (v && !v.startsWith('#')) v = '#' + v;
                      setHexDraft((d) => ({ ...d, [s.slot]: v }));
                      if (isHexColor(v)) {
                        setInvalid((d) => ({ ...d, [s.slot]: false }));
                        commitColor(s.slot, v);
                      } else {
                        setInvalid((d) => ({ ...d, [s.slot]: true }));
                      }
                    }}
                  />
                  <span className="tcr-applied" title={t('themeAppliedPreviewTitle')} style={{ background: customSlotAppliedColor(s.slot, state.customColors) }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export function themeButtonDotColor(theme: string | null, customColors: CustomThemeColors, customLabel: string): string | null {
  if (!theme) return null;
  return getTheme(theme, customColors, customLabel).colors[2];
}
