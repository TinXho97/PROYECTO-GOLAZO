import React, { useState, useEffect, useMemo } from 'react';
import { format, isSameDay, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Trash2, 
  Phone, 
  User as UserIcon, 
  Clock, 
  MapPin,
  Filter,
  ChevronRight,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Download,
  Maximize2,
  CheckCircle2,
  XCircle,
  Play,
  AlertCircle,
  TrendingUp,
  UserPlus,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Badge } from '../components/Badge';
import { dataService, api } from '../services/dataService';
import { Booking, Pitch, User, BookingStatus } from '../types';
import { cn } from '../lib/utils';
import { getEffectiveClientId } from '../lib/tenant';

interface BookingsListProps {
  user: User;
}

export default function BookingsList({ user }: BookingsListProps) {
  const effectiveClientId = getEffectiveClientId(user);
  const isPlayerUser = user.role === 'client';
  const isPublicPortalUser = isPlayerUser && user.id.startsWith('public-player:');
  const isPublicGooglePlayer = isPublicPortalUser && dataService.getPublicAccessMode() === 'google';
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const clientId = effectiveClientId;
      if (!clientId && !isPublicGooglePlayer) {
        setLoadError('No se pudieron cargar las reservas: falta client_id del complejo seleccionado.');
        setPitches([]);
        setBookings([]);
        return;
      }

      try {
        setLoadError(null);
        const p = isPlayerUser
          ? (clientId ? await dataService.getPublicPitches(clientId) : [])
          : await dataService.getPitches(clientId);
        setPitches(p);

        if (isPlayerUser) {
          if (isPublicGooglePlayer) {
            const ownBookings = await dataService.getPublicOwnBookings();
            setBookings(ownBookings);
          } else {
            setBookings([]);
          }
          return;
        }

        try {
          const b = await dataService.getBookings(clientId);
          setBookings(b);
        } catch (bookingsError) {
          console.error('Error loading bookings:', bookingsError);
          setBookings([]);
        }
      } catch (error) {
        console.error('Error loading bookings list:', error);
        setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las canchas del complejo seleccionado.');
      }
    };
    fetchData();
  }, [effectiveClientId, isPlayerUser, isPublicGooglePlayer]);

  const userBookingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.userId] = (counts[b.userId] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           b.clientPhone.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
      const matchesUser = user.role === 'admin' || isPublicGooglePlayer || b.userId === user.id || (isPlayerUser && !!user.phone && b.clientPhone === user.phone);
      
      return matchesSearch && matchesStatus && matchesUser;
    }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [bookings, searchTerm, filterStatus, user, isPlayerUser, isPublicGooglePlayer]);

  const groupedBookings = useMemo(() => {
    const today = startOfDay(new Date());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: Record<string, Booking[]> = {};

    filteredBookings.forEach(b => {
      const date = startOfDay(b.startTime);
      let key = '';

      if (isSameDay(date, today)) {
        key = 'HOY';
      } else if (isSameDay(date, yesterday)) {
        key = 'AYER';
      } else {
        key = format(date, "d MMM", { locale: es }).toUpperCase();
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(b);
    });

    // Sort groups: HOY first, then AYER, then by date descending
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'HOY') return -1;
      if (b === 'HOY') return 1;
      if (a === 'AYER') return -1;
      if (b === 'AYER') return 1;
      
      // For other dates, we need to parse them back or just use the first booking's date
      const dateA = groups[a][0].startTime.getTime();
      const dateB = groups[b][0].startTime.getTime();
      return dateB - dateA; // Descending
    });

    return sortedKeys.map(key => ({
      title: key,
      bookings: groups[key].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    }));
  }, [filteredBookings]);

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      const clientId = effectiveClientId;
      const clientIdForQuery = clientId || undefined;
      await api.updateBookingStatus(id, status, clientIdForQuery);
      const b = await dataService.getBookings(clientIdForQuery);
      setBookings(b);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleTogglePayment = async (id: string) => {
    try {
      const clientId = effectiveClientId;
      const clientIdForQuery = clientId || undefined;
      await api.toggleBookingPayment(id, clientIdForQuery);
      const b = await dataService.getBookings(clientIdForQuery);
      setBookings(b);
    } catch (error) {
      console.error('Error toggling payment:', error);
    }
  };

  const executeCancel = async () => {
    if (!confirmCancel) return;
    try {
      const clientId = effectiveClientId;
      const clientIdForQuery = clientId || undefined;
      await api.cancelBooking(confirmCancel, clientIdForQuery);
      const b = await dataService.getBookings(clientIdForQuery);
      setBookings(b);
      setConfirmCancel(null);
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const renderBookingCard = (booking: Booking, i: number) => {
    const pitch = pitches.find(p => p.id === booking.pitchId);
    const bookingCount = userBookingCounts[booking.userId] || 0;
    const isFrequent = bookingCount > 5;
    const isNew = bookingCount <= 1;
    
    const now = new Date();
    const isInPlay = booking.status === 'confirmed' && now >= booking.startTime && now <= booking.endTime;
    const isFinished = booking.status === 'completed' || (booking.status === 'confirmed' && now > booking.endTime);

    const total = pitch?.price || 0;
    const deposit = booking.depositAmount || 0;
    const debt = total - deposit;

    return (
      <motion.div
        key={booking.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        layout
      >
        <Card 
          className={cn(
            "border-2 shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer relative",
            (booking.status === 'cancelled' || booking.status === 'no_show') ? "border-red-50 bg-red-50/10" : "border-zinc-100 bg-white",
            isInPlay ? "border-emerald-500 ring-2 ring-emerald-500/20" : "hover:border-sky-200"
          )}
          onClick={() => setSelectedBookingForDetail(booking)}
        >
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: 'var(--bg-flag-ar)' }} />
          {isInPlay && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse z-20" />
          )}
          
          <CardContent className="p-0 relative z-10">
            <div className="flex flex-col md:flex-row">
              {/* Time Section */}
              <div className={cn(
                cn("flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-zinc-100", isPlayerUser ? "p-4 md:w-36" : "md:w-48 p-6"),
                isInPlay ? "bg-emerald-500 text-white" :
                booking.status === 'confirmed' ? "bg-emerald-50/30" : 
                booking.status === 'pending' ? "bg-amber-50/30" :
                booking.status === 'completed' ? "bg-zinc-50/50" : "bg-red-50/30"
              )}>
                {isInPlay ? (
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest mb-1">En Juego</span>
                  </div>
                ) : (
                  <Clock className={cn(
                    "w-5 h-5 mb-2",
                    booking.status === 'confirmed' ? "text-emerald-500" : 
                    booking.status === 'pending' ? "text-amber-500" :
                    booking.status === 'completed' ? "text-zinc-400" : "text-red-500"
                  )} />
                )}
                <span className={cn(
                  cn("font-black leading-none", isPlayerUser ? "text-xl" : "text-2xl"),
                  isInPlay ? "text-white" : "text-zinc-900"
                )}>
                  {format(booking.startTime, 'HH:mm')}
                </span>
                <span className={cn(
                  cn("font-black uppercase tracking-widest mt-1", isPlayerUser ? "text-xs" : "text-sm"),
                  isInPlay ? "text-emerald-100" : "text-zinc-500"
                )}>
                  a {format(booking.endTime, 'HH:mm')} hs
                </span>
              </div>

              {/* Main Content */}
              <div className={cn("flex-1 flex flex-col lg:flex-row lg:items-center justify-between", isPlayerUser ? "gap-4 p-4" : "p-6 gap-6")}>
                <div className={cn("flex-1", isPlayerUser ? "space-y-3" : "space-y-4")}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className={cn("font-black text-zinc-900", isPlayerUser ? "text-lg" : "text-xl")}>{booking.clientName}</h4>
                    <div className="flex gap-2">
                      {isInPlay ? (
                        <Badge className="bg-emerald-500 text-white border-none animate-pulse">EN JUEGO</Badge>
                      ) : (
                        <>
                          {booking.status === 'confirmed' && <Badge variant="success">Confirmado</Badge>}
                          {booking.status === 'pending' && <Badge variant="warning">Pendiente</Badge>}
                          {booking.status === 'completed' && <Badge variant="neutral">Finalizado</Badge>}
                          {(booking.status === 'cancelled' || booking.status === 'no_show') && <Badge variant="danger">Cancelado</Badge>}
                        </>
                      )}
                      
                      {isFrequent && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Frecuente
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className={cn("flex items-center gap-2 text-zinc-900 font-black", isPlayerUser ? "text-base" : "text-lg")}>
                    <MapPin className="w-5 h-5 text-sky-500" />
                    {pitch?.name || 'Cancha eliminada'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                      <Phone className="w-4 h-4 text-sky-500" />
                      {booking.clientPhone}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {total > 0 ? (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-500 font-medium w-12">Seña:</span>
                            <span className="font-bold text-zinc-900">${deposit}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-500 font-medium w-12">Total:</span>
                            <span className="font-bold text-zinc-900">${total}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-500 font-medium w-12">Debe:</span>
                            <span className={cn(
                              "font-black",
                              booking.isPaid ? "text-emerald-600" : "text-amber-600"
                            )}>
                              ${debt > 0 ? debt : 0}
                            </span>
                            {booking.isPaid ? (
                              <span className="ml-1 text-[10px] uppercase tracking-tighter bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Pagado</span>
                            ) : (
                              <span className="ml-1 text-[10px] uppercase tracking-tighter bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Pendiente</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-zinc-500 font-medium w-12">Seña:</span>
                          <span className="font-bold text-zinc-900">${deposit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 rounded-xl px-3"
                      onClick={() => window.open(`https://wa.me/${booking.clientPhone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </Button>
                    {booking.receiptUrl && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-sky-200 text-sky-600 hover:bg-sky-50 rounded-xl px-3"
                        onClick={() => setSelectedReceipt(booking.receiptUrl!)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {user.role === 'admin' && (
                    <div className="flex gap-2">
                      {!booking.isPaid && booking.status !== 'cancelled' && (
                        <Button 
                          size="sm" 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl px-4 shadow-lg shadow-emerald-200 flex-1"
                          onClick={() => handleTogglePayment(booking.id)}
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          COBRAR
                        </Button>
                      )}
                      {booking.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl px-4 flex-1"
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Confirmar
                        </Button>
                      )}
                      {booking.status === 'confirmed' && !isInPlay && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold rounded-xl px-4 flex-1"
                          onClick={() => handleStatusUpdate(booking.id, 'completed')}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Finalizar
                        </Button>
                      )}
                      {booking.status !== 'cancelled' && booking.status !== 'no_show' && booking.status !== 'completed' && !isInPlay && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-xl px-4 flex-1"
                          onClick={() => setConfirmCancel(booking.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em]">Error de carga</p>
        <p className="mt-2 text-lg font-bold">{loadError}</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full pb-20", isPlayerUser ? "space-y-4" : "space-y-8")}>
      <header className={cn(
        "flex flex-col md:flex-row md:items-center justify-between",
        isPlayerUser ? "gap-3 rounded-[24px] border border-white/10 bg-white/95 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:p-5" : "gap-6"
      )}>
        <div>
          <h1 className={cn("font-black text-zinc-900 tracking-tighter", isPlayerUser ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl")}>
            {user.role === 'admin' ? 'Gestión de Reservas' : 'Mis turnos'}
          </h1>
          <p className={cn("text-zinc-500 font-medium", isPlayerUser && "text-sm")}>
            {isPlayerUser ? 'Tus reservas del complejo, simples y ordenadas' : 'Panel de control y seguimiento'}
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className={cn(
        "space-y-4",
        isPlayerUser
          ? "bg-white/95 p-3 rounded-[24px] border border-white/40 shadow-2xl shadow-slate-950/15 backdrop-blur-xl sm:p-4"
          : "bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm"
      )}>
        <div className={cn("flex flex-col lg:flex-row", isPlayerUser ? "gap-3" : "gap-4")}>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              className={cn(
                "w-full pl-12 pr-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-medium",
                isPlayerUser ? "py-3 text-sm" : "py-4"
              )}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className={cn("flex items-center gap-2 bg-zinc-50 px-4 rounded-2xl border border-zinc-100", isPlayerUser ? "py-2.5" : "py-2")}>
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                className="bg-transparent font-bold text-sm outline-none text-zinc-600"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmados</option>
                <option value="completed">Finalizados</option>
                <option value="cancelled">Cancelados</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(isPlayerUser ? "space-y-6" : "space-y-12")}>
        {groupedBookings.map((group, groupIndex) => (
          <section key={group.title} className={cn(isPlayerUser ? "space-y-3" : "space-y-6")}>
            <div className="flex items-center gap-3">
              <div className={cn(
                cn("rounded-xl flex items-center justify-center text-white shadow-lg", isPlayerUser ? "h-8 w-8" : "w-10 h-10"),
                group.title === 'HOY' ? "bg-emerald-500 shadow-emerald-200" :
                group.title === 'AYER' ? "bg-sky-500 shadow-sky-200" :
                "bg-zinc-400 shadow-zinc-200"
              )}>
                {group.title === 'HOY' ? <CalendarIcon className="w-5 h-5" /> :
                 group.title === 'AYER' ? <History className="w-5 h-5" /> :
                 <CalendarIcon className="w-5 h-5" />}
              </div>
              <h2 className={cn("font-black text-zinc-900 tracking-tight uppercase", isPlayerUser ? "text-xl" : "text-2xl")}>{group.title}</h2>
              <Badge variant="neutral" className={cn(
                "border-none",
                group.title === 'HOY' ? "bg-emerald-100 text-emerald-700" :
                group.title === 'AYER' ? "bg-sky-100 text-sky-700" :
                "bg-zinc-100 text-zinc-700"
              )}>
                {group.bookings.length} {group.bookings.length === 1 ? 'reserva' : 'reservas'}
              </Badge>
            </div>
            <div className={cn(isPlayerUser ? "space-y-3" : "space-y-4")}>
              {group.bookings.map((booking, i) => renderBookingCard(booking, i))}
            </div>
          </section>
        ))}

        {filteredBookings.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-center bg-white border-2 border-dashed border-zinc-100",
              isPlayerUser ? "rounded-[28px] px-6 py-14" : "py-24 rounded-[40px]"
            )}
          >
            <div className={cn("bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto", isPlayerUser ? "mb-4 h-14 w-14" : "w-20 h-20 mb-6")}>
              <AlertCircle className={cn("text-zinc-200", isPlayerUser ? "h-7 w-7" : "w-10 h-10")} />
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-2">
              {isPlayerUser
                ? (isPublicGooglePlayer ? 'Todavia no tenes turnos' : 'Ingresa con Google para ver tus turnos guardados')
                : 'No se encontraron reservas'}
            </h3>
            <p className="text-zinc-400 font-medium">
              {isPlayerUser ? (isPublicGooglePlayer ? 'Cuando reserves con esta cuenta, tus turnos apareceran aca.' : 'Las reservas sin cuenta siguen funcionando, pero no quedan asociadas a un historial personal.') : 'Intentá cambiar los filtros o realizá una nueva reserva.'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBookingForDetail}
        onClose={() => setSelectedBookingForDetail(null)}
        title="Detalles de la Reserva"
      >
        {selectedBookingForDetail && (
          <div className="space-y-6">
            <div className={cn(
              "flex items-center gap-4 p-6 rounded-3xl border-2",
              selectedBookingForDetail.status === 'confirmed' ? "bg-emerald-50 border-emerald-100" : 
              selectedBookingForDetail.status === 'pending' ? "bg-amber-50 border-amber-100" :
              selectedBookingForDetail.status === 'completed' ? "bg-zinc-50 border-zinc-100" : "bg-red-50 border-red-100"
            )}>
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                selectedBookingForDetail.status === 'confirmed' ? "bg-emerald-500 shadow-emerald-200" : 
                selectedBookingForDetail.status === 'pending' ? "bg-amber-500 shadow-amber-200" :
                selectedBookingForDetail.status === 'completed' ? "bg-zinc-400 shadow-zinc-200" : "bg-red-500 shadow-red-200"
              )}>
                <CalendarIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900">
                  {format(selectedBookingForDetail.startTime, "EEEE d 'de' MMMM", { locale: es })}
                </h3>
                <div className="flex items-center gap-2 text-zinc-500 font-bold">
                  <Clock className="w-4 h-4" />
                  {format(selectedBookingForDetail.startTime, 'HH:mm')} - {format(selectedBookingForDetail.endTime, 'HH:mm')} hs
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cliente</p>
                <p className="font-black text-zinc-900 text-lg">{selectedBookingForDetail.clientName}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Teléfono</p>
                <p className="font-bold text-zinc-900">{selectedBookingForDetail.clientPhone}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cancha</p>
                <p className="font-bold text-zinc-900">
                  {pitches.find(p => p.id === selectedBookingForDetail.pitchId)?.name || 'Cancha eliminada'}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Estado</p>
                <div className="mt-1">
                  {selectedBookingForDetail.status === 'confirmed' && <Badge variant="success">Confirmado</Badge>}
                  {selectedBookingForDetail.status === 'pending' && <Badge variant="warning">Pendiente</Badge>}
                  {selectedBookingForDetail.status === 'completed' && <Badge variant="neutral">Finalizado</Badge>}
                  {(selectedBookingForDetail.status === 'cancelled' || selectedBookingForDetail.status === 'no_show') && <Badge variant="danger">Cancelado</Badge>}
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-900 rounded-[32px] text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-zinc-400">Información de Pago</span>
                </div>
                {selectedBookingForDetail.isPaid ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Totalmente Pagado</Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pago Pendiente</Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-zinc-400 font-medium">Seña entregada</span>
                <span className="text-2xl font-black text-white">${selectedBookingForDetail.depositAmount || 0}</span>
              </div>

              {selectedBookingForDetail.paymentUrl && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50 mt-2">
                  <span className="text-zinc-400 font-medium">Ref. Mercado Pago</span>
                  <span className="text-sm font-black text-sky-400">{selectedBookingForDetail.paymentUrl}</span>
                </div>
              )}

              {user.role === 'admin' && !selectedBookingForDetail.isPaid && (
                <Button 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl mt-2"
                  onClick={() => {
                    handleTogglePayment(selectedBookingForDetail.id);
                    setSelectedBookingForDetail(prev => prev ? { ...prev, isPaid: true } : null);
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirmar Pago Total
                </Button>
              )}
            </div>

            {selectedBookingForDetail.receiptUrl && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Comprobante Adjunto</p>
                <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 group">
                  {selectedBookingForDetail.receiptUrl.startsWith('data:application/pdf') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <FileText className="w-16 h-16 text-zinc-400 mb-4" />
                      <p className="text-zinc-500 font-bold mb-4">Comprobante en formato PDF</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-xl"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedBookingForDetail.receiptUrl!;
                          link.download = `comprobante-${selectedBookingForDetail.id}.pdf`;
                          link.click();
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={selectedBookingForDetail.receiptUrl} 
                        alt="Comprobante" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="rounded-xl"
                          onClick={() => setSelectedReceipt(selectedBookingForDetail.receiptUrl!)}
                        >
                          <Maximize2 className="w-4 h-4 mr-2" />
                          Ver Pantalla Completa
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={executeCancel}
        title="Cancelar Reserva"
        message="¿Estás seguro de que deseas cancelar esta reserva? El turno quedará disponible nuevamente."
        confirmText="CANCELAR TURNO"
        cancelText="VOLVER"
      />

      {/* Receipt Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Comprobante de Pago"
      >
        <div className="p-4">
          {selectedReceipt && (
            selectedReceipt.startsWith('data:application/pdf') ? (
              <div className="w-full h-64 flex flex-col items-center justify-center p-6 text-center bg-zinc-100 rounded-2xl">
                <FileText className="w-16 h-16 text-zinc-400 mb-4" />
                <p className="text-zinc-500 font-bold mb-4">Comprobante en formato PDF</p>
                <Button 
                  variant="secondary" 
                  className="rounded-xl"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedReceipt;
                    link.download = `comprobante.pdf`;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            ) : (
              <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                <img 
                  src={selectedReceipt} 
                  alt="Comprobante" 
                  className="w-full h-auto object-contain max-h-[70vh]"
                  referrerPolicy="no-referrer"
                />
              </div>
            )
          )}
        </div>
      </Modal>
    </div>
  );
}
