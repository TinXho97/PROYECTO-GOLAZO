import React from 'react';
import { cn } from '../../lib/utils';

interface AdminPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  badge,
  icon,
  actions,
  meta,
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-sky-100/80 bg-white p-5 shadow-[0_18px_45px_rgba(8,26,51,0.08)] sm:p-6 lg:p-7',
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#DDF3FF]/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-8 h-1 w-24 rounded-full bg-[#F6C453]" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#DDF3FF] text-[#0EA5E9] ring-1 ring-sky-100">
              {icon}
            </div>
          )}

          <div className="min-w-0 space-y-2">
            {meta && (
              <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#64748B]">
                {meta}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="text-3xl font-black tracking-[-0.045em] text-[#0F2747] sm:text-4xl">
                {title}
              </h1>
              {badge}
            </div>

            {subtitle && (
              <div className="text-sm font-semibold text-[#64748B] sm:text-base">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="relative mt-5">{children}</div>}
    </section>
  );
}
