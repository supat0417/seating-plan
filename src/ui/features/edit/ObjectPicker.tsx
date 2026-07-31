import { useState } from 'react';
import { OBJECT_TYPE_DEFS, type ObjectType } from '../../../domain/floorplan';
import { useT } from '../../i18n/I18nContext';
import type { Dictionary } from '../../../domain/i18n';

export function ObjectPicker({ onAdd }: { onAdd: (type: ObjectType) => void }) {
  const { t } = useT();
  const [draggingType, setDraggingType] = useState<ObjectType | null>(null);

  return (
    <div className="obj-picker">
      {OBJECT_TYPE_DEFS.map((td) => (
        <div
          key={td.type}
          className={`obj-card${draggingType === td.type ? ' dragging' : ''}`}
          draggable
          onClick={() => onAdd(td.type)}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', td.type);
            e.dataTransfer.effectAllowed = 'copy';
            setDraggingType(td.type);
          }}
          onDragEnd={() => setDraggingType(null)}
        >
          <div className={`icon-shape ${td.type}`} />
          <span className="lbl">{t(td.labelKey as keyof Dictionary)}</span>
        </div>
      ))}
    </div>
  );
}
