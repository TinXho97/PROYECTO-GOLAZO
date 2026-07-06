import type { ReactNode } from 'react';
import { Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AdminStatusBadge, type AdminStatusBadgeTone } from './AdminStatusBadge';

export interface AdminBookingPreviewCardProps {
  id: string;
  time: ReactNode;
  clientName: ReactNode;
  pitchName?: ReactNode;
  clientPhone?: ReactNode;
  statusLabel: ReactNode;
  statusTone?: AdminStatusBadgeTone;
  paymentLabel?: ReactNode;
  paymentTone?: AdminStatusBadgeTone;
  className?: string;
}

export function AdminBookingPreviewCard({
  time,
  clientName,
  pitchName,
  clientPhone,
  statusLabel,
  statusTone = 'neutral',
  paymentLabel,
  paymentTone = 'neutral',
  className,
}: AdminBookingPreviewCardProps) {
  return (
    <div
      className={cn(
        'grid gap-3 rounded-[18px] border border-slate-200/80 bg-[#F8FBFF] p-3 transition-colors hover:border-sky-200 hover:bg-white sm:grid-cols-[74px_1fr_auto]',
        className
      )}
    >
      <div className="flex items-center sm:block">
        <p className="min-w-16 rounded-2xl bg-white px-3 py-2 text-center text-lg font-bold leading-none text-[#0F2747] shadow-sm ring-1 ring-slate-100">
          {time}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-[#0F2747]">{clientName}</p>
          <AdminStatusBadge tone={statusTone} className="px-2 py-0.5 text-[11px]">
            {statusLabel}
          </AdminStatusBadge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-[#64748B]">
          {pitchName && <span>{pitchName}</span>}
          {clientPhone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {clientPhone}
            </span>
          )}
        </div>
      </div>

      {paymentLabel && (
        <div className="flex items-start sm:justify-end">
          <AdminStatusBadge tone={paymentTone} className="whitespace-nowrap">
            {paymentLabel}
          </AdminStatusBadge>
        </div>
      )}
    </div>
  );
}
