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

interface BookingsListProps {
  user: User;
}

export default function BookingsList({ user }: BookingsListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  useEffect(() => {
    setPitches(dataService.getPitches());
    setBookings(dataService.getBookings());

    // Auto-refresh every minute to update statuses based on time
    const interval = setInterval(() => {
      setBookings(dataService.getBookings());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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
      const matchesUser = user.role === 'admin' || b.userId === user.id;
      
      return matchesSearch && matchesStatus && matchesUser;
    }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [bookings, searchTerm, filterStatus, user]);

  const groupedBookings = useMemo(() => {
    const today = startOfDay(new Date());

    return {
      today: filteredBookings.filter(b => isSameDay(b.startTime, today)),
      upcoming: filteredBookings.filter(b => isAfter(b.startTime, endOfDay(today))),
      history: filteredBookings.filter(b => isBefore(b.startTime, today))
    };
  }, [filteredBookings]);

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      await api.updateBookingStatus(id, status);
      setBookings(dataService.getBookings());
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleTogglePayment = async (id: string) => {
    try {
      await api.toggleBookingPayment(id);
      setBookings(dataService.getBookings());
    } catch (error) {
      console.error('Error toggling payment:', error);
    }
  };

  const executeCancel = async () => {
    if (!confirmCancel) return;
    try {
      await api.cancelBooking(confirmCancel);
      setBookings(dataService.getBookings());
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
    const isFinished = booking.status === 'finished' || (booking.status === 'confirmed' && now > booking.endTime);

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
            booking.status === 'cancelled' ? "border-red-50 bg-red-50/10" : "border-zinc-100 bg-white",
            isInPlay ? "border-emerald-500 ring-2 ring-emerald-500/20" : "hover:border-sky-200"
          )}
          onClick={() => setSelectedBookingForDetail(booking)}
        >
          {isInPlay && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse" />
          )}
          
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Time Section */}
              <div className={cn(
                "md:w-40 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-zinc-100",
                isInPlay ? "bg-emerald-500 text-white" :
                booking.status === 'confirmed' ? "bg-emerald-50/30" : 
                booking.status === 'pending' ? "bg-amber-50/30" :
                booking.status === 'finished' ? "bg-zinc-50/50" : "bg-red-50/30"
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
                    booking.status === 'finished' ? "text-zinc-400" : "text-red-500"
                  )} />
                )}
                <span className={cn(
                  "text-xl font-black leading-none",
                  isInPlay ? "text-white" : "text-zinc-900"
                )}>
                  {format(booking.startTime, 'HH:mm')}
                </span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest mt-1",
                  isInPlay ? "text-emerald-100" : "text-zinc-400"
                )}>
                  a {format(booking.endTime, 'HH:mm')} hs
                </span>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-xl font-black text-zinc-900">{booking.clientName}</h4>
                    <div className="flex gap-2">
                      {isInPlay ? (
                        <Badge className="bg-emerald-500 text-white border-none animate-pulse">EN JUEGO</Badge>
                      ) : (
                        <>
                          {booking.status === 'confirmed' && <Badge variant="success">Confirmado</Badge>}
                          {booking.status === 'pending' && <Badge variant="warning">Pendiente</Badge>}
                          {booking.status === 'finished' && <Badge variant="neutral">Finalizado</Badge>}
                          {booking.status === 'cancelled' && <Badge variant="danger">Cancelado</Badge>}
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

                  {isInPlay && !booking.isPaid && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-black animate-bounce">
                      <AlertCircle className="w-4 h-4" />
                      ¡EL PARTIDO ESTÁ EN CURSO! RECORDAR COBRAR EL SALDO.
                    </div>
                  )}

                  {isFinished && !booking.isPaid && booking.status !== 'cancelled' && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-black">
                      <AlertCircle className="w-4 h-4" />
                      PARTIDO FINALIZADO SIN REGISTRO DE PAGO TOTAL.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                      <MapPin className="w-4 h-4 text-sky-500" />
                      {pitch?.name || 'Cancha eliminada'}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                      <Phone className="w-4 h-4 text-sky-500" />
                      {booking.clientPhone}
                    </div>
                    {booking.depositAmount && (
                      <div className={cn(
                        "flex items-center gap-2 font-black text-sm",
                        booking.isPaid ? "text-emerald-600" : "text-amber-600"
                      )}>
                        <DollarSign className="w-4 h-4" />
                        Seña: ${booking.depositAmount} 
                        {booking.isPaid ? (
                          <span className="flex items-center ml-1 text-[10px] uppercase tracking-tighter bg-emerald-100 px-1.5 py-0.5 rounded">Pagado</span>
                        ) : (
                          <span className="flex items-center ml-1 text-[10px] uppercase tracking-tighter bg-amber-100 px-1.5 py-0.5 rounded">Pendiente</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                  {user.role === 'admin' && (
                    <>
                      {!booking.isPaid && booking.status !== 'cancelled' && (
                        <Button 
                          size="sm" 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl px-4 shadow-lg shadow-emerald-200"
                          onClick={() => handleTogglePayment(booking.id)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          COBRAR
                        </Button>
                      )}
                      {booking.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl px-4"
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirmar
                        </Button>
                      )}
                      {booking.status === 'confirmed' && !isInPlay && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold rounded-xl px-4"
                          onClick={() => handleStatusUpdate(booking.id, 'finished')}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Finalizar
                        </Button>
                      )}
                      {booking.status !== 'cancelled' && booking.status !== 'finished' && !isInPlay && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-xl px-4"
                          onClick={() => setConfirmCancel(booking.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </>
                  )}
                  <div className="w-8 h-8 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 group-hover:bg-sky-50 group-hover:text-sky-500 transition-all ml-2">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">
            {user.role === 'admin' ? 'Gestión de Reservas' : 'Mis Reservas'}
          </h1>
          <p className="text-zinc-500 font-medium">Panel de control y seguimiento</p>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              className="w-full pl-12 pr-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-zinc-50 px-4 py-2 rounded-2xl border border-zinc-100">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                className="bg-transparent font-bold text-sm outline-none text-zinc-600"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmados</option>
                <option value="finished">Finalizados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* Today Section */}
        {groupedBookings.today.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Hoy</h2>
              <Badge variant="neutral" className="bg-emerald-100 text-emerald-700 border-none">
                {groupedBookings.today.length} {groupedBookings.today.length === 1 ? 'reserva' : 'reservas'}
              </Badge>
            </div>
            <div className="space-y-4">
              {groupedBookings.today.map((booking, i) => renderBookingCard(booking, i))}
            </div>
          </section>
        )}

        {/* Upcoming Section */}
        {groupedBookings.upcoming.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-200">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Próximas Reservas</h2>
              <Badge variant="neutral" className="bg-sky-100 text-sky-700 border-none">
                {groupedBookings.upcoming.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {groupedBookings.upcoming.map((booking, i) => renderBookingCard(booking, i))}
            </div>
          </section>
        )}

        {/* History Section */}
        {groupedBookings.history.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-zinc-200">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Historial</h2>
            </div>
            <div className="space-y-4">
              {groupedBookings.history.map((booking, i) => renderBookingCard(booking, i))}
            </div>
          </section>
        )}

        {filteredBookings.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-zinc-100"
          >
            <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-zinc-200" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-2">No se encontraron reservas</h3>
            <p className="text-zinc-400 font-medium">Intenta cambiar los filtros o realiza una nueva reserva.</p>
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
              selectedBookingForDetail.status === 'finished' ? "bg-zinc-50 border-zinc-100" : "bg-red-50 border-red-100"
            )}>
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                selectedBookingForDetail.status === 'confirmed' ? "bg-emerald-500 shadow-emerald-200" : 
                selectedBookingForDetail.status === 'pending' ? "bg-amber-500 shadow-amber-200" :
                selectedBookingForDetail.status === 'finished' ? "bg-zinc-400 shadow-zinc-200" : "bg-red-500 shadow-red-200"
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
                  {selectedBookingForDetail.status === 'finished' && <Badge variant="neutral">Finalizado</Badge>}
                  {selectedBookingForDetail.status === 'cancelled' && <Badge variant="danger">Cancelado</Badge>}
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
                          onClick={() => window.open(selectedBookingForDetail.receiptUrl, '_blank')}
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
    </div>
  );
}
