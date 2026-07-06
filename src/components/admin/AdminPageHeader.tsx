import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface AdminPageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
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
        'rounded-[22px] border border-[#DDE7F0] bg-[#F8FBFF] p-4 shadow-[0_8px_22px_rgba(8,26,51,0.05)] sm:p-5',
        className
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0EA5E9] shadow-sm ring-1 ring-sky-100">
              {icon}
            </div>
          )}

          <div className="min-w-0 space-y-1.5">
            {meta && (
              <div className="text-xs font-semibold text-[#64748B]">
                {meta}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="text-2xl font-bold leading-tight text-[#0F2747] sm:text-[1.7rem]">
                {title}
              </h1>
              {badge}
            </div>

            {subtitle && (
              <div className="text-sm font-medium leading-6 text-[#64748B]">
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

      {children && <div className="mt-4 border-t border-slate-200/70 pt-4">{children}</div>}
    </section>
  );
}
