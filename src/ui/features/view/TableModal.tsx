import { seatRosterForTable } from '../../../domain/guest';
import type { FloorplanObject } from '../../../domain/floorplan';
import { useT } from '../../i18n/I18nContext';
import { usePlan } from '../../state/PlanProvider';
import { ModalBackdrop, ModalCloseButton } from '../../components/Modal';

export function TableModal({ obj, onClose }: { obj: FloorplanObject; onClose: () => void }) {
  const { t } = useT();
  const { state } = usePlan();
  const roster = seatRosterForTable(state.guests, obj);
  const filledCount = roster.filter((r) => !r.empty).length;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal">
        <ModalCloseButton onClose={onClose} label={t('modalCloseLabel')} />
        <h3>{obj.label}</h3>
        <div className="cap">{t('capacityFraction', filledCount, obj.capacity || '-')}</div>
        {roster.length ? (
          <ul className="guest-list">
            {roster.map((r, i) => (
              <li key={i}>
                <span className={r.empty ? 'empty-seat-tag' : ''}>{r.empty ? t('emptyValuePlaceholder') : r.name}</span>
                <span className="seatno">{t('seatInline', r.seat)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="hint">{t('noGuestForTable')}</div>
        )}
      </div>
    </ModalBackdrop>
  );
}
