import type { ComponentType, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type AdminMetricTone = 'blue' | 'green' | 'gold' | 'danger' | 'purple' | 'orange' | 'neutral';

export interface AdminMetricCardProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: AdminMetricTone;
  helperText?: ReactNode;
  className?: string;
}

const toneClasses: Record<AdminMetricTone, { icon: string; ring: string; accent: string }> = {
  blue: {
    icon: 'bg-[#DDF3FF] text-[#0EA5E9]',
    ring: 'group-hover:border-sky-200 group-hover:shadow-sky-950/10',
    accent: 'bg-[#0EA5E9]',
  },
  green: {
    icon: 'bg-emerald-50 text-[#10B981]',
    ring: 'group-hover:border-emerald-200 group-hover:shadow-emerald-950/10',
    accent: 'bg-[#10B981]',
  },
  gold: {
    icon: 'bg-amber-50 text-[#F6C453]',
    ring: 'group-hover:border-amber-200 group-hover:shadow-amber-950/10',
    accent: 'bg-[#F6C453]',
  },
  danger: {
    icon: 'bg-red-50 text-[#EF4444]',
    ring: 'group-hover:border-red-200 group-hover:shadow-red-950/10',
    accent: 'bg-[#EF4444]',
  },
  purple: {
    icon: 'bg-[#DDF3FF] text-[#0EA5E9]',
    ring: 'group-hover:border-sky-200 group-hover:shadow-sky-950/10',
    accent: 'bg-[#0EA5E9]',
  },
  orange: {
    icon: 'bg-amber-50 text-[#F6C453]',
    ring: 'group-hover:border-amber-200 group-hover:shadow-amber-950/10',
    accent: 'bg-[#F6C453]',
  },
  neutral: {
    icon: 'bg-slate-100 text-[#0F2747]',
    ring: 'group-hover:border-slate-200 group-hover:shadow-slate-950/10',
    accent: 'bg-[#64748B]',
  },
};

export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  helperText,
  className,
}: AdminMetricCardProps) {
  const styles = toneClasses[tone];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[20px] border border-[#DDE7F0] bg-[#F8FBFF] p-4 shadow-[0_8px_20px_rgba(8,26,51,0.045)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_26px_rgba(8,26,51,0.07)]',
        styles.ring,
        className
      )}
    >
      <div className={cn('absolute left-5 top-0 h-0.5 w-10 rounded-b-full', styles.accent)} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#64748B]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold leading-none text-[#081A33] sm:text-[1.7rem]">
            {value}
          </p>
          {helperText && (
            <p className="mt-2 text-sm font-medium text-[#64748B]">
              {helperText}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/70',
              styles.icon
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
    </div>
  );
}
