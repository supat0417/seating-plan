import { useEffect } from 'react';
import { usePlan } from '../state/PlanProvider';
import { useToast } from '../components/Toast';
import { useT } from '../i18n/I18nContext';

/** Ports the original's single global keydown listener: Delete (edit mode only), Ctrl+Z /
 * Ctrl+Shift+Z / Ctrl+Y (undo/redo, edit+guests modes), Ctrl+C / Ctrl+V (copy/paste, edit
 * mode only) — ignored while a modal is open or an input/textarea has focus. */
export function useGlobalKeyboardShortcuts() {
  const { state, dispatch } = usePlan();
  const { showToast } = useToast();
  const { t } = useT();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (state.mode !== 'edit' && state.mode !== 'guests') return;
      if (document.querySelector('.modal-backdrop')) return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (!(e.ctrlKey || e.metaKey)) {
        const isDelete = e.code === 'Delete' || e.key === 'Delete';
        if (isDelete && state.mode === 'edit' && state.selectedIds.length > 0) {
          e.preventDefault();
          const n = state.selectedIds.length;
          dispatch({ type: 'DELETE_OBJECTS', ids: state.selectedIds });
          showToast(n > 1 ? t('toastDeleteMulti', n) : t('toastDeleteOne'));
        }
        return;
      }

      const isZ = e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z';
      const isY = e.code === 'KeyY' || e.key === 'y' || e.key === 'Y';
      if (isZ) {
        e.preventDefault();
        if (e.shiftKey) {
          if (state.redoStack.length === 0) showToast(t('toastNoRedo'));
          else {
            dispatch({ type: 'REDO' });
            showToast(t('toastRedoDone'));
          }
        } else {
          if (state.undoStack.length === 0) showToast(t('toastNoUndo'));
          else {
            dispatch({ type: 'UNDO' });
            showToast(t('toastUndoDone'));
          }
        }
        return;
      }
      if (isY) {
        e.preventDefault();
        if (state.redoStack.length === 0) showToast(t('toastNoRedo'));
        else {
          dispatch({ type: 'REDO' });
          showToast(t('toastRedoDone'));
        }
        return;
      }

      if (state.mode !== 'edit') return;
      const isC = e.code === 'KeyC' || e.key === 'c' || e.key === 'C';
      const isV = e.code === 'KeyV' || e.key === 'v' || e.key === 'V';
      if (isC) {
        e.preventDefault();
        if (state.selectedIds.length === 0) {
          showToast(t('toastCopyNone'));
        } else {
          dispatch({ type: 'COPY_SELECTION' });
          const objs = state.floorplan.filter((o) => state.selectedIds.includes(o.id));
          showToast(objs.length > 1 ? t('toastCopyMulti', objs.length) : t('toastCopyOne', objs[0]?.label ?? ''));
        }
      } else if (isV) {
        e.preventDefault();
        if (!state.clipboard || state.clipboard.length === 0) {
          showToast(t('toastPasteNone'));
        } else {
          const n = state.clipboard.length;
          dispatch({ type: 'PASTE_CLIPBOARD' });
          showToast(n > 1 ? t('toastPasteMulti', n) : t('toastPasteOne'));
        }
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state, dispatch, showToast, t]);
}
