import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, Trophy, type LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { dataService } from '../services/dataService';
import { Booking, Client, Pitch } from '../types';

interface ClientDetailUser {
  id: string;
  email: string | null;
  last_sign_in_at?: string;
  role?: string;
  client_id?: string;
  profile?: {
    name?: string;
    phone?: string | null;
  };
}

interface ClientDetailViewProps {
  client: Client;
  users: ClientDetailUser[];
  onBack: () => void;
}

export function ClientDetailView({ client, users, onBack }: ClientDetailViewProps) {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const admins = useMemo(
    () => users.filter((user) => user.role !== 'superadmin' && user.client_id === client.id),
    [client.id, users],
  );

  useEffect(() => {
    const fetchClientData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [clientPitches, clientBookings] = await Promise.all([
          dataService.getPitches(client.id),
          dataService.getBookings(client.id),
        ]);

        setPitches(clientPitches);
        setBookings(clientBookings);
      } catch (err) {
        console.error('Error loading client detail:', err);
        setError(err instanceof Error ? err.message : 'No se pudo cargar el detalle del cliente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [client.id]);

  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed').length;
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a clientes
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">{client.complex_name || client.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="font-mono rounded-md bg-[#111827] px-2 py-1 text-xs text-slate-300">ID: {client.id}</span>
              {client.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {client.address}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={`w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${client.status === 'active' ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border border-red-500/20 bg-red-500/10 text-red-400'}`}>
          {client.status === 'active' ? 'Activo' : 'Suspendido'}
        </span>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard label="Admins" value={admins.length} icon={ShieldCheck} />
        <SummaryCard label="Canchas" value={pitches.length} icon={Trophy} />
        <SummaryCard label="Reservas" value={bookings.length} icon={CalendarDays} />
        <SummaryCard label="Pendientes" value={pendingBookings} icon={CalendarDays} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-[32px] border border-white/5 bg-[#111827] py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B00]/20 border-t-[#FF6B00]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-[32px] border border-white/5 bg-[#111827] p-6">
            <h3 className="mb-4 text-lg font-black text-white">Administradores</h3>
            <div className="space-y-3">
              {admins.length === 0 ? (
                <EmptyState text="No hay administradores asignados." />
              ) : (
                admins.map((admin) => (
                  <div key={admin.id} className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4">
                    <p className="font-bold text-slate-100">{admin.email || admin.profile?.name || 'Sin email'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ultimo acceso: {admin.last_sign_in_at ? format(new Date(admin.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Nunca'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/5 bg-[#111827] p-6">
            <h3 className="mb-4 text-lg font-black text-white">Canchas</h3>
            <div className="space-y-3">
              {pitches.length === 0 ? (
                <EmptyState text="No hay canchas cargadas." />
              ) : (
                pitches.map((pitch) => (
                  <div key={pitch.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#0B0F19] p-4">
                    <div>
                      <p className="font-bold text-slate-100">{pitch.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{pitch.type}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${pitch.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {pitch.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/5 bg-[#111827] p-6">
            <h3 className="mb-4 text-lg font-black text-white">Reservas</h3>
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <EmptyState text="No hay reservas registradas." />
              ) : (
                bookings.slice(0, 12).map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-100">{booking.clientName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {format(booking.startTime, 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-slate-300">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {bookings.length > 12 && (
                <p className="pt-2 text-center text-xs font-bold text-slate-500">
                  Mostrando 12 de {bookings.length} reservas.
                </p>
              )}
              {confirmedBookings > 0 && (
                <p className="pt-2 text-xs font-bold text-emerald-400">
                  Confirmadas: {confirmedBookings}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-[24px] border border-white/5 bg-[#111827] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-[#1F2937]">
        <Icon className="h-5 w-5 text-[#FF6B00]" />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B0F19] p-5 text-center text-sm font-medium text-slate-500">
      {text}
    </div>
  );
}
