import { useState } from 'react';
import { CAP_MAX, CAP_MIN, DIM_MAX, DIM_MIN, clampNum, isRotatableType, isTableType, type FloorplanObject } from '../../../domain/floorplan';
import { useT } from '../../i18n/I18nContext';
import { SelectIcon } from '../../components/Icons';

export interface SidePanelProps {
  selected: FloorplanObject[];
  onUpdateFields: (id: string, fields: Partial<FloorplanObject>) => void;
  onDelete: (id: string) => void;
  onDeleteMulti: () => void;
  onClearSelection: () => void;
}

export function SidePanel({ selected, onUpdateFields, onDelete, onDeleteMulti, onClearSelection }: SidePanelProps) {
  const { t } = useT();

  if (selected.length > 1) {
    return (
      <>
        <div className="hint">
          {t('selectedCount', selected.length)}
          <br />
          {t('dragGroupHint')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          <button className="chip" style={{ justifyContent: 'center' }} onClick={onClearSelection}>{t('clearSelection')}</button>
          <button className="chip danger" style={{ justifyContent: 'center' }} onClick={onDeleteMulti}>{t('deleteAllCount', selected.length)}</button>
        </div>
      </>
    );
  }

  const obj = selected[0];
  if (!obj) {
    return (
      <div className="empty-note compact">
        <span className="eni"><SelectIcon size={26} /></span>
        {t('sidePanelEmptyMulti')}
      </div>
    );
  }

  return <SingleObjectFields key={obj.id} obj={obj} onUpdateFields={onUpdateFields} onDelete={onDelete} />;
}

function SingleObjectFields({ obj, onUpdateFields, onDelete }: { obj: FloorplanObject; onUpdateFields: SidePanelProps['onUpdateFields']; onDelete: SidePanelProps['onDelete'] }) {
  const { t } = useT();
  const isTable = isTableType(obj.type);
  const isRotatable = isRotatableType(obj.type);
  const [label, setLabel] = useState(obj.label);
  const [cap, setCap] = useState(String(obj.capacity));
  const [w, setW] = useState(String(obj.w));
  const [h, setH] = useState(String(obj.h));
  const [rotNum, setRotNum] = useState(String(Math.round(obj.rot || 0)));

  function commit(fields: Partial<FloorplanObject>) {
    onUpdateFields(obj.id, fields);
  }

  function setRot(deg: number) {
    const d = ((deg % 360) + 360) % 360;
    setRotNum(String(d));
    commit({ rot: d });
  }

  return (
    <>
      <label>{isTable ? t('fieldLabelTable') : t('fieldLabel')}</label>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => commit({ label: label || obj.label })}
      />
      {isTable && (
        <>
          <label>{t('fieldCapacity')}</label>
          <input
            type="number"
            min={0}
            max={30}
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            onBlur={() => commit({ capacity: clampNum(parseInt(cap, 10) || 0, CAP_MIN, CAP_MAX) })}
          />
        </>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label>{t('fieldWidth')}</label>
          <input type="number" min={20} max={600} value={w} onChange={(e) => setW(e.target.value)} onBlur={() => commit({ w: clampNum(parseInt(w, 10) || obj.w, DIM_MIN, DIM_MAX) })} />
        </div>
        <div>
          <label>{t('fieldHeight')}</label>
          <input type="number" min={20} max={600} value={h} onChange={(e) => setH(e.target.value)} onBlur={() => commit({ h: clampNum(parseInt(h, 10) || obj.h, DIM_MIN, DIM_MAX) })} />
        </div>
      </div>
      {isRotatable && (
        <>
          <label>{t('fieldRotation')}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number" min={0} max={359} style={{ width: 64, flex: 'none' }}
              value={rotNum}
              onChange={(e) => setRotNum(e.target.value)}
              onBlur={() => setRot(parseInt(rotNum, 10) || 0)}
            />
            <button className="chip" style={{ flex: 1, padding: '6px 2px', justifyContent: 'center', fontSize: 12 }} onClick={() => setRot((obj.rot || 0) - 15)}>-15°</button>
            <button className="chip" style={{ flex: 1, padding: '6px 2px', justifyContent: 'center', fontSize: 12 }} onClick={() => setRot((obj.rot || 0) + 15)}>+15°</button>
            <button className="chip" style={{ flex: 1, padding: '6px 2px', justifyContent: 'center', fontSize: 12 }} onClick={() => setRot(0)}>{t('rotReset')}</button>
          </div>
        </>
      )}
      <button className="chip danger" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => onDelete(obj.id)}>{t('deleteObjectBtn')}</button>
    </>
  );
}
