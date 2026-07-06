import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface AdminEmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
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
        'flex flex-col gap-3 rounded-[18px] border border-[#DDE7F0] bg-white/70 p-4 sm:flex-row sm:items-center',
        className
      )}
    >
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0EA5E9] shadow-sm ring-1 ring-sky-100">
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight text-[#0F2747]">{title}</p>
        {description && (
          <p className="mt-0.5 text-sm font-medium leading-5 text-[#64748B]">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
