import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type AdminStatusBadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'gold';

export interface AdminStatusBadgeProps {
  children: ReactNode;
  tone?: AdminStatusBadgeTone;
  className?: string;
}

const toneClasses: Record<AdminStatusBadgeTone, string> = {
  success: 'border-emerald-100 bg-emerald-50 text-[#10B981]',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
  danger: 'border-red-100 bg-red-50 text-[#EF4444]',
  neutral: 'border-slate-200 bg-slate-50 text-[#64748B]',
  info: 'border-sky-100 bg-[#DDF3FF] text-[#0EA5E9]',
  gold: 'border-amber-100 bg-amber-50 text-[#B7791F]',
};

export function AdminStatusBadge({
  children,
  tone = 'neutral',
  className,
}: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
