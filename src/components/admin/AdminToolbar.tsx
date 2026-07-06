import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface AdminToolbarProps {
  children: ReactNode;
  className?: string;
}

export function AdminToolbar({ children, className }: AdminToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[20px] border border-slate-200/80 bg-white p-3 shadow-[0_8px_20px_rgba(8,26,51,0.045)] sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {children}
    </div>
  );
}
