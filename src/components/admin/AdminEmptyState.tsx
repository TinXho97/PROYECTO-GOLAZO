import React from 'react';
import { cn } from '../../lib/utils';

interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function AdminEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-[20px] border border-sky-100 bg-[#F6FBFF] p-4',
        className
      )}
    >
      {icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0EA5E9] shadow-sm ring-1 ring-sky-100">
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-black tracking-[-0.02em] text-[#0F2747]">{title}</p>
        {description && (
          <p className="mt-0.5 text-sm font-semibold leading-5 text-[#64748B]">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
