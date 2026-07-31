import { useT } from '../i18n/I18nContext';
import { ModalBackdrop, ModalCloseButton } from './Modal';

export function HelpModal({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal modal-lg">
        <ModalCloseButton onClose={onClose} label={t('modalCloseLabel')} />
        <h3>{t('helpTitle')}</h3>
        <div className="cap">{t('helpSubtitle')}</div>
        <div className="help-content" dangerouslySetInnerHTML={{ __html: t('helpContent') }} />
      </div>
    </ModalBackdrop>
  );
}
