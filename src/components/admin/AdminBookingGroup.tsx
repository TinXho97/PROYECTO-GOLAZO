import type { ReactNode } from 'react';
import { CalendarDays, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AdminStatusBadge } from './AdminStatusBadge';

export interface AdminBookingGroupProps {
  title: string;
  count: number;
  children: ReactNode;
  className?: string;
}

const getDisplayTitle = (title: string) => {
  if (title === 'HOY') return 'Hoy';
  if (title === 'AYER') return 'Ayer';
  return title;
};

export function AdminBookingGroup({
  title,
  count,
  children,
  className,
}: AdminBookingGroupProps) {
  const isToday = title === 'HOY';
  const isYesterday = title === 'AYER';
  const Icon = isYesterday ? History : CalendarDays;

  return (
    <section className={cn('space-y-3.5', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-2xl border shadow-sm',
            isToday
              ? 'border-emerald-100 bg-emerald-50 text-[#10B981]'
              : isYesterday
                ? 'border-sky-100 bg-[#DDF3FF] text-[#0EA5E9]'
                : 'border-slate-200 bg-white text-[#64748B]'
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h2 className="text-lg font-bold leading-tight text-[#0F2747]">
            {getDisplayTitle(title)}
          </h2>
          <p className="text-sm font-medium text-[#64748B]">Reservas agrupadas por fecha</p>
        </div>
        <AdminStatusBadge tone={isToday ? 'success' : isYesterday ? 'info' : 'neutral'}>
          {count} {count === 1 ? 'reserva' : 'reservas'}
        </AdminStatusBadge>
      </div>

      <div className="space-y-3">{children}</div>
    </section>
  );
}
