// React ports of the original inline-SVG ICONS builder. Same paths/viewBox/stroke config.
import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Base({ size = 15, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function BrandIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 3v18M3 9h5" />
    </svg>
  );
}
export function EditIcon(p: IconProps) {
  return <Base {...p}><path d="M4 7v6h6" /><path d="M20 17a8 8 0 0 0-14.9-4" /></Base>;
}
export function GuestsIcon(p: IconProps) {
  return <Base {...p}><circle cx={9} cy={7} r={3} /><path d="M2 20c0-3.3 3-6 7-6s7 2.7 7 6" /><circle cx={17} cy={8} r={2.3} /><path d="M22 20c0-2.6-2-4.7-4.5-5.3" /></Base>;
}
export function SearchIcon(p: IconProps) {
  return <Base {...p}><circle cx={11} cy={11} r={7} /><path d="m21 21-4.3-4.3" /></Base>;
}
export function UndoIcon(p: IconProps) {
  return <Base {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-1" /></Base>;
}
export function RedoIcon(p: IconProps) {
  return <Base {...p}><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h1" /></Base>;
}
export function DownloadIcon(p: IconProps) {
  return <Base {...p}><path d="M12 15V3M7 10l5 5 5-5" /><path d="M4 21h16" /></Base>;
}
export function UploadIcon(p: IconProps) {
  return <Base {...p}><path d="M12 3v12M7 8l5-5 5 5" /><path d="M4 21h16" /></Base>;
}
export function PaletteIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx={12} cy={12} r={9} />
      <circle cx={9} cy={10} r={1.3} fill="currentColor" stroke="none" />
      <circle cx={14.5} cy={9} r={1.3} fill="currentColor" stroke="none" />
      <circle cx={16} cy={13.5} r={1.3} fill="currentColor" stroke="none" />
      <path d="M12 3a9 9 0 1 0 5 16.5c1-.7.4-2 -.8-2H14a2.5 2.5 0 0 1 0-5h3a2 2 0 0 0 2-2 9 9 0 0 0-7-7Z" fill="none" />
    </Base>
  );
}
export function HelpIcon(p: IconProps) {
  return <Base {...p}><circle cx={12} cy={12} r={9} /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 1.9v.3" /><path d="M12 17h.01" /></Base>;
}
export function CloseIcon(p: IconProps) {
  return <Base {...p}><path d="M18 6 6 18M6 6l12 12" /></Base>;
}
export function StatusEmptyIcon({ size = 13, ...p }: IconProps) {
  return <Base size={size} {...p}><circle cx={12} cy={12} r={9} /></Base>;
}
export function StatusFullIcon({ size = 13, ...p }: IconProps) {
  return <Base size={size} {...p}><path d="m4 12 5 5L20 6" /></Base>;
}
export function StatusOverIcon({ size = 13, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
export function SelectIcon({ size = 26, ...p }: IconProps) {
  return (
    <Base size={size} {...p}>
      <rect x={4} y={4} width={16} height={16} rx={3} strokeDasharray="3 3" />
      <circle cx={12} cy={12} r={1.6} fill="currentColor" stroke="none" />
    </Base>
  );
}
export function TrashIcon(p: IconProps) {
  return <Base {...p}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></Base>;
}

export function TableStatusIcon({ status, size }: { status: 'nocap' | 'empty' | 'partial' | 'full' | 'over'; size?: number }) {
  if (status === 'over') return <StatusOverIcon size={size ?? 12} />;
  if (status === 'full' || status === 'nocap') return <StatusFullIcon size={size ?? 11} />;
  return <StatusEmptyIcon size={size ?? 11} />;
}
