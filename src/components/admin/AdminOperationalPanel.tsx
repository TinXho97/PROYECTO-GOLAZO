import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface AdminOperationalPanelProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function AdminOperationalPanel({
  title,
  eyebrow,
  icon,
  action,
  children,
  className,
  bodyClassName,
}: AdminOperationalPanelProps) {
  return (
    <section
      className={cn(
        'rounded-[22px] border border-[#DDE7F0] bg-[#F8FBFF] p-4 shadow-[0_10px_26px_rgba(8,26,51,0.055)] sm:p-5',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0EA5E9] shadow-sm ring-1 ring-sky-100">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="text-xs font-semibold text-[#64748B]">{eyebrow}</p>}
            <h2 className="text-lg font-bold leading-tight text-[#0F2747]">{title}</h2>
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
