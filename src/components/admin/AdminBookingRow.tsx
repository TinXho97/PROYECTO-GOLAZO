import type { KeyboardEvent, ReactNode } from 'react';
import { CheckCircle2, Clock, DollarSign, FileText, MapPin, Phone, Play, TrendingUp, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Booking } from '../../types';
import { cn } from '../../lib/utils';
import { AdminStatusBadge, type AdminStatusBadgeTone } from './AdminStatusBadge';

export interface AdminBookingRowProps {
  booking: Booking;
  pitchName: string;
  pitchPrice: number;
  bookingCount: number;
  isInPlay: boolean;
  isFinished: boolean;
  onOpenDetails: () => void;
  onWhatsApp: () => void;
  onViewReceipt?: () => void;
  onCharge?: () => void;
  onConfirm?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

const statusMeta: Record<Booking['status'], { label: string; tone: AdminStatusBadgeTone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  confirmed: { label: 'Confirmada', tone: 'success' },
  completed: { label: 'Finalizada', tone: 'neutral' },
  cancelled: { label: 'Cancelada', tone: 'danger' },
  no_show: { label: 'No show', tone: 'danger' },
};

function AdminRowButton({
  children,
  onClick,
  tone = 'neutral',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'primary' | 'success' | 'danger' | 'neutral' | 'whatsapp';
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center justify-center gap-2 rounded-[14px] border px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30',
        tone === 'primary' && 'border-sky-200 bg-[#DDF3FF] text-[#0284C7] hover:bg-sky-100',
        tone === 'success' && 'border-emerald-100 bg-emerald-50 text-[#10B981] hover:bg-emerald-100',
        tone === 'danger' && 'border-red-100 bg-red-50 text-[#EF4444] hover:bg-red-100',
        tone === 'whatsapp' && 'border-emerald-100 bg-white text-[#16A34A] hover:bg-emerald-50',
        tone === 'neutral' && 'border-slate-200 bg-white text-[#64748B] hover:bg-slate-50 hover:text-[#0F2747]'
      )}
    >
      {children}
    </button>
  );
}

export function AdminBookingRow({
  booking,
  pitchName,
  pitchPrice,
  bookingCount,
  isInPlay,
  isFinished,
  onOpenDetails,
  onWhatsApp,
  onViewReceipt,
  onCharge,
  onConfirm,
  onComplete,
  onCancel,
}: AdminBookingRowProps) {
  const total = pitchPrice || 0;
  const deposit = booking.depositAmount || 0;
  const debt = Math.max(total - deposit, 0);
  const isCancelled = booking.status === 'cancelled' || booking.status === 'no_show';
  const meta = isInPlay ? { label: 'En juego', tone: 'info' as AdminStatusBadgeTone } : statusMeta[booking.status];
  const paymentTone: AdminStatusBadgeTone = booking.isPaid ? 'success' : debt > 0 ? 'warning' : 'neutral';
  const paymentLabel = booking.isPaid ? 'Pagado' : debt > 0 ? 'Debe' : 'Sin total';

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenDetails();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpenDetails}
      onKeyDown={handleKeyDown}
      className={cn(
        'group grid cursor-pointer gap-4 rounded-[22px] border bg-[#F8FBFF] p-4 shadow-[0_8px_22px_rgba(8,26,51,0.045)] transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-[0_14px_28px_rgba(8,26,51,0.07)] lg:grid-cols-[104px_minmax(0,1fr)_minmax(260px,0.65fr)] lg:items-center',
        isInPlay && 'border-sky-200 ring-2 ring-sky-100',
        isCancelled && 'border-red-100 bg-red-50/40'
      )}
    >
      <div className="flex items-center gap-3 lg:block">
        <div
          className={cn(
            'flex h-[74px] w-[86px] shrink-0 flex-col items-center justify-center rounded-[18px] border bg-white text-center shadow-sm',
            isInPlay && 'border-sky-200 bg-[#DDF3FF]',
            isCancelled && 'border-red-100 bg-white'
          )}
        >
          <span className="text-2xl font-bold leading-none text-[#0F2747]">
            {format(booking.startTime, 'HH:mm')}
          </span>
          <span className="mt-1 text-xs font-semibold text-[#64748B]">
            a {format(booking.endTime, 'HH:mm')}
          </span>
        </div>
        <div className="lg:mt-2 lg:flex lg:justify-center">
          <AdminStatusBadge tone={isFinished ? 'neutral' : isInPlay ? 'info' : 'neutral'} className="text-[11px]">
            <Clock className="h-3 w-3" />
            {isInPlay ? 'Ahora' : isFinished ? 'Pasado' : 'Próximo'}
          </AdminStatusBadge>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-bold text-[#0F2747] sm:text-lg">{booking.clientName}</h3>
          <AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge>
          {bookingCount > 5 && (
            <AdminStatusBadge tone="info">
              <TrendingUp className="h-3 w-3" />
              Frecuente
            </AdminStatusBadge>
          )}
          {bookingCount <= 1 && <AdminStatusBadge tone="neutral">Nuevo</AdminStatusBadge>}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-[#64748B]">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#0EA5E9]" />
            {pitchName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-[#0EA5E9]" />
            {booking.clientPhone}
          </span>
        </div>
      </div>

      <div className="space-y-3" onClick={(event) => event.stopPropagation()}>
        <div className="grid grid-cols-3 gap-2 rounded-[18px] border border-[#DDE7F0] bg-white p-2.5">
          <div>
            <p className="text-[11px] font-medium text-[#64748B]">Seña</p>
            <p className="text-sm font-bold text-[#0F2747]">${deposit}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#64748B]">Total</p>
            <p className="text-sm font-bold text-[#0F2747]">${total}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#64748B]">Debe</p>
            <div className="mt-0.5">
              <AdminStatusBadge tone={paymentTone} className="px-2 py-0.5 text-[11px]">
                {paymentLabel} ${booking.isPaid ? 0 : debt}
              </AdminStatusBadge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <AdminRowButton tone="whatsapp" title="WhatsApp" onClick={onWhatsApp}>
            <Phone className="h-4 w-4" />
          </AdminRowButton>
          {booking.receiptUrl && onViewReceipt && (
            <AdminRowButton tone="primary" title="Comprobante" onClick={onViewReceipt}>
              <FileText className="h-4 w-4" />
            </AdminRowButton>
          )}
          {!booking.isPaid && !isCancelled && onCharge && (
            <AdminRowButton tone="success" onClick={onCharge}>
              <DollarSign className="h-4 w-4" />
              Cobrar
            </AdminRowButton>
          )}
          {booking.status === 'pending' && onConfirm && (
            <AdminRowButton tone="success" onClick={onConfirm}>
              <CheckCircle2 className="h-4 w-4" />
              Confirmar
            </AdminRowButton>
          )}
          {booking.status === 'confirmed' && !isInPlay && onComplete && (
            <AdminRowButton onClick={onComplete}>
              <Play className="h-4 w-4" />
              Finalizar
            </AdminRowButton>
          )}
          {!isCancelled && booking.status !== 'completed' && !isInPlay && onCancel && (
            <AdminRowButton tone="danger" onClick={onCancel}>
              <XCircle className="h-4 w-4" />
              Cancelar
            </AdminRowButton>
          )}
        </div>
      </div>
    </article>
  );
}
