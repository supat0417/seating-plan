import { usePlan } from '../../state/PlanProvider';
import { useT } from '../../i18n/I18nContext';
import { PlanPreview } from './PlanPreview';

export function ViewTab() {
  const { state } = usePlan();
  const { t } = useT();

  return (
    <>
      {state.floorplan.length === 0 ? (
        <div className="panel"><div className="empty-note">{t('noFloorplanYet')}</div></div>
      ) : (
        <PlanPreview floorplan={state.floorplan} guests={state.guests} logo={state.logo} />
      )}
    </>
  );
}
