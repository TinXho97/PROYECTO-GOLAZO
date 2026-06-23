import React from 'react';
import { cn } from '../../lib/utils';

interface AdminSectionCardProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminSectionCard({
  title,
  icon,
  eyebrow,
  action,
  children,
  className,
}: AdminSectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-slate-200/70 bg-white p-4 shadow-[0_14px_35px_rgba(8,26,51,0.06)] sm:p-5',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#DDF3FF] text-[#0EA5E9] ring-1 ring-sky-100">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#64748B]">
                {eyebrow}
              </p>
            )}
            <h2 className="text-xl font-black tracking-[-0.03em] text-[#0F2747]">
              {title}
            </h2>
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {children}
    </section>
  );
}
