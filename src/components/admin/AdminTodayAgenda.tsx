import { CalendarDays } from 'lucide-react';
import { AdminActionButton } from './AdminActionButton';
import { AdminBookingPreviewCard, type AdminBookingPreviewCardProps } from './AdminBookingPreviewCard';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminOperationalPanel } from './AdminOperationalPanel';

export interface AdminTodayAgendaProps {
  bookings: AdminBookingPreviewCardProps[];
  totalCount: number;
  hiddenCount?: number;
  onViewAll?: () => void;
  onCreateBooking?: () => void;
  onOpenCalendar?: () => void;
}

export function AdminTodayAgenda({
  bookings,
  totalCount,
  hiddenCount = 0,
  onViewAll,
  onCreateBooking,
  onOpenCalendar,
}: AdminTodayAgendaProps) {
  const action = onViewAll && totalCount > 0 ? (
    <AdminActionButton variant="secondary" size="sm" onClick={onViewAll}>
      Ver reservas
    </AdminActionButton>
  ) : undefined;

  return (
    <AdminOperationalPanel
      title={totalCount > 0 ? 'Turnos de hoy' : 'Agenda de hoy'}
      eyebrow={totalCount > 0 ? `${totalCount} turnos confirmados` : 'Hoy'}
      icon={<CalendarDays className="h-5 w-5" />}
      action={action}
    >
      {bookings.length > 0 ? (
        <div className="space-y-2.5">
          {bookings.map((booking) => (
            <AdminBookingPreviewCard key={booking.id} {...booking} />
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={onViewAll}
              className="w-full rounded-2xl border border-dashed border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-[#0EA5E9] transition hover:border-sky-300 hover:bg-[#F6FBFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30"
            >
              Ver {hiddenCount} reservas más
            </button>
          )}
        </div>
      ) : (
        <AdminEmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="No hay reservas programadas para hoy"
          description="Creá una reserva o abrí el calendario para cargar el próximo turno."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              {onCreateBooking && (
                <AdminActionButton size="sm" onClick={onCreateBooking}>
                  Crear reserva
                </AdminActionButton>
              )}
              {onOpenCalendar && (
                <AdminActionButton variant="secondary" size="sm" onClick={onOpenCalendar}>
                  Ir al calendario
                </AdminActionButton>
              )}
            </div>
          }
        />
      )}
    </AdminOperationalPanel>
  );
}
