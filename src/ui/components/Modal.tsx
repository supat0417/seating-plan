import type { ReactNode } from 'react';
import { CloseIcon } from './Icons';

export function ModalBackdrop({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

export function ModalCloseButton({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <button className="modal-close" aria-label={label} onClick={onClose} type="button">
      <CloseIcon size={14} />
    </button>
  );
}
