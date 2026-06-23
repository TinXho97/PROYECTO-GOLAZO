import React from 'react';
import { cn } from '../../lib/utils';

type AdminMetricTone = 'blue' | 'green' | 'purple' | 'orange' | 'neutral';

interface AdminMetricCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ElementType;
  tone?: AdminMetricTone;
  helperText?: React.ReactNode;
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
  purple: {
    icon: 'bg-violet-50 text-violet-600',
    ring: 'group-hover:border-violet-200 group-hover:shadow-violet-950/10',
    accent: 'bg-violet-500',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-500',
    ring: 'group-hover:border-orange-200 group-hover:shadow-orange-950/10',
    accent: 'bg-orange-400',
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
        'group relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-[0_14px_35px_rgba(8,26,51,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(8,26,51,0.10)]',
        styles.ring,
        className
      )}
    >
      <div className={cn('absolute left-5 top-0 h-1 w-12 rounded-b-full', styles.accent)} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#64748B]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#081A33] sm:text-4xl">
            {value}
          </p>
          {helperText && (
            <p className="mt-2 text-sm font-semibold text-[#64748B]">
              {helperText}
            </p>
          )}
        </div>

        {Icon && (
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ring-1 ring-white/70', styles.icon)}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
