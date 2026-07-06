import { CheckCircle2, Plus, Zap } from 'lucide-react';
import type { Booking } from '../../types';
import { cn } from '../../lib/utils';

export type AdminCalendarSlotStatus = 'available' | 'past' | 'occupied' | 'partial' | 'deactivated';
export type AdminCalendarSlotLayout = 'grid' | 'mobile';

export interface AdminCalendarSlotProps {
  status: AdminCalendarSlotStatus;
  booking?: Booking | null;
  primaryLabel: string;
  secondaryLabel?: string;
  isManagementMode?: boolean;
  isPromo?: boolean;
  canSeeDetails?: boolean;
  layout?: AdminCalendarSlotLayout;
  onClick?: () => void;
}

const statusCopy: Record<AdminCalendarSlotStatus, string> = {
  available: 'Libre',
  past: 'Pasado',
  occupied: 'Reservado',
  partial: 'Pendiente',
  deactivated: 'Desactivado',
};

export function AdminCalendarSlot({
  status,
  booking,
  primaryLabel,
  secondaryLabel,
  isManagementMode = false,
  isPromo = false,
  canSeeDetails = false,
  layout = 'grid',
  onClick,
}: AdminCalendarSlotProps) {
  const isPast = status === 'past';
  const isAvailable = status === 'available';
  const isOccupied = status === 'occupied' || status === 'partial';
  const displayLabel = isOccupied && canSeeDetails && booking?.clientName ? booking.clientName : statusCopy[status];

  return (
    <button
      type="button"
      disabled={isPast}
      onClick={onClick}
      className={cn(
        'group/slot relative w-full overflow-hidden rounded-[16px] border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30',
        layout === 'grid' ? 'min-h-[54px] p-2.5' : 'min-h-[58px] p-3',
        isPast && 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400',
        status === 'deactivated' && 'border-slate-200 bg-slate-100 text-slate-500 opacity-75',
        status === 'occupied' && 'border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70',
        status === 'partial' && 'border-amber-100 bg-amber-50 text-amber-800 hover:bg-amber-100/70',
        isAvailable && 'border-sky-100 bg-white text-[#0F2747] shadow-sm hover:-translate-y-0.5 hover:border-sky-200 hover:bg-[#F6FBFF] hover:shadow-[0_10px_20px_rgba(8,26,51,0.06)]',
        isManagementMode && 'ring-2 ring-amber-400/20'
      )}
    >
      <div className={cn('flex gap-3', layout === 'grid' ? 'items-start justify-between' : 'items-center justify-between')}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                isPast ? 'bg-slate-300' : status === 'deactivated' ? 'bg-slate-400' : status === 'partial' ? 'bg-amber-500' : status === 'occupied' ? 'bg-emerald-500' : 'bg-[#0EA5E9]'
              )}
            />
            <span className="truncate text-sm font-bold leading-tight">{displayLabel}</span>
          </div>
          <p className="mt-1 truncate text-xs font-medium opacity-75">{primaryLabel}</p>
          {secondaryLabel && <p className="mt-0.5 truncate text-[11px] font-medium opacity-65">{secondaryLabel}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isPromo && !isPast && <Zap className="h-3.5 w-3.5 text-amber-500" />}
          {isAvailable && !isManagementMode && <Plus className="h-4 w-4 text-[#0EA5E9] opacity-70" />}
          {isManagementMode && <Zap className={cn('h-4 w-4', status === 'deactivated' ? 'text-slate-400' : 'text-amber-500')} />}
          {isOccupied && booking?.isPaid && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        </div>
      </div>

      {isAvailable && !isManagementMode && layout === 'grid' && (
        <p className="mt-1.5 text-[11px] font-semibold text-[#0EA5E9] opacity-0 transition-opacity group-hover/slot:opacity-100">
          Crear reserva
        </p>
      )}
      {isManagementMode && (
        <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
          Click para {status === 'deactivated' ? 'activar' : 'desactivar'}
        </p>
      )}
    </button>
  );
}
