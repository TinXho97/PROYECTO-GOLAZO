import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addHours, startOfHour } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Filter, 
  Clock, 
  User, 
  Phone, 
  MapPin,
  Trophy,
  Maximize2,
  Minimize2,
  DollarSign,
  FileText,
  Download,
  Zap,
  Info,
  AlertCircle,
  CheckCircle2,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { dataService, api } from '../services/dataService';
import { Pitch, Booking, User as UserType } from '../types';
import { cn } from '../lib/utils';

interface CalendarProps {
  user: UserType;
}

export default function CalendarPage({ user }: CalendarProps) {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [filterPitch, setFilterPitch] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<{ hour: number, day: Date, pitch: Pitch } | null>(null);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    pitch: null as Pitch | null,
    date: new Date(),
    time: '',
    clientName: user.role === 'client' ? user.name : '',
    clientPhone: '',
    receipt: null as string | null,
    depositAmount: ''
  });

  useEffect(() => {
    setPitches(dataService.getPitches());
    setBookings(dataService.getBookings());
  }, [selectedDate]);

  const hours = Array.from({ length: 15 }, (_, i) => (i + 10) % 24); // 10:00 to 01:00
  
  const days = view === 'day' 
    ? [selectedDate] 
    : eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      });

  const filteredPitches = filterPitch === 'all' 
    ? pitches 
    : pitches.filter(p => p.id === filterPitch);

  const isPromoHour = (hour: number) => hour >= 10 && hour <= 16;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.pitch || !bookingData.time) return;

    if (!bookingData.receipt) {
      toast.error('Por favor, carga el comprobante de la seña.');
      return;
    }

    const [h, m] = bookingData.time.split(':').map(Number);
    const startTime = new Date(bookingData.date);
    startTime.setHours(h, m, 0, 0);
    const endTime = addHours(startTime, 1);

    try {
      const isPromo = h >= 10 && h <= 16;
      const points = isPromo ? 1.5 : 1;

      await api.addBooking({
        pitchId: bookingData.pitch.id,
        userId: user.id,
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        startTime,
        endTime,
        status: 'confirmed',
        receiptUrl: bookingData.receipt,
        depositAmount: Number(bookingData.depositAmount) || 0
      });
      
      setBookings(dataService.getBookings());
      setIsBookingModalOpen(false);
      setBookingData(prev => ({ ...prev, receipt: null, depositAmount: '' }));
      
      toast.success('¡Reserva confirmada!', {
        description: isPromo 
          ? `¡Sumaste +${points} puntos por horario promocional! 🔥`
          : `¡Sumaste +${points} puntos!`,
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('El archivo es muy pesado (máximo 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBookingData(prev => ({ ...prev, receipt: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Dynamic Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 rounded-[32px] text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center animate-bounce">
              <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">¡HORARIOS PROMOCIONALES ACTIVOS!</h3>
              <p className="text-sm font-medium text-white/80">Hoy de 10:00 a 16:00 sumás <span className="text-yellow-300 font-black">+1.5 puntos extra</span> por reserva.</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            className="bg-white text-purple-600 font-black rounded-2xl px-8 hover:scale-105 transition-transform"
            onClick={() => {
              const promoHour = hours.find(h => isPromoHour(h));
              if (promoHour) {
                const element = document.getElementById(`slot-${promoHour}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          >
            VER AHORA
          </Button>
        </div>
      </motion.div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Calendario de Turnos</h1>
          <p className="text-zinc-500 font-medium">Elegí el mejor horario para tu equipo</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm">
            <button
              onClick={() => setView('day')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === 'day' ? "bg-argentina text-zinc-900 shadow-lg shadow-sky-500/20" : "text-zinc-400 hover:text-zinc-900"
              )}
            >
              Día
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === 'week' ? "bg-argentina text-zinc-900 shadow-lg shadow-sky-500/20" : "text-zinc-400 hover:text-zinc-900"
              )}
            >
              Semana
            </button>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={cn(
                "p-2 rounded-xl transition-all",
                isCompact ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-900"
              )}
              title={isCompact ? "Vista Normal" : "Vista Compacta"}
            >
              {isCompact ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => addDays(d, view === 'day' ? -1 : -7))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <button 
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="px-4 font-bold text-zinc-700 min-w-[140px] text-center hover:bg-zinc-50 py-1 rounded-xl transition-colors"
              >
                {view === 'day' 
                  ? format(selectedDate, "d 'de' MMMM", { locale: es })
                  : `${format(days[0], "d MMM")} - ${format(days[6], "d MMM")}`
                }
              </button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => addDays(d, view === 'day' ? 1 : 7))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {isCalendarOpen && (
              <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-zinc-100 rounded-3xl shadow-2xl p-4">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }}
                  locale={es}
                  className="rdp-custom"
                />
              </div>
            )}
          </div>

          <select
            className="bg-white px-4 py-2.5 rounded-2xl border border-zinc-100 shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-sky-500"
            value={filterPitch}
            onChange={e => setFilterPitch(e.target.value)}
          >
            <option value="all">Todas las canchas</option>
            {pitches.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </header>

      <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(150px,1fr))] border-b border-zinc-100 bg-zinc-50/50">
              <div className="p-4 border-r border-zinc-100" />
              {days.map(day => (
                <div key={day.toString()} className="p-4 text-center border-r border-zinc-100 last:border-r-0">
                  <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400 mb-1">
                    {format(day, 'EEEE', { locale: es })}
                  </p>
                  <p className={cn(
                    "text-xl font-black",
                    isSameDay(day, new Date()) ? "text-sky-600" : "text-zinc-900"
                  )}>
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            {hours.map(hour => (
              <div 
                key={hour} 
                id={`slot-${hour}`}
                className={cn(
                  "grid grid-cols-[100px_repeat(auto-fit,minmax(150px,1fr))] border-b border-zinc-100 last:border-b-0 group/row",
                  isCompact ? "min-h-[80px]" : "min-h-[120px]"
                )}
              >
                <div className="p-4 border-r border-zinc-100 bg-zinc-50/30 flex flex-col items-center justify-center gap-1">
                  <span className="text-lg font-black text-zinc-400 group-hover/row:text-zinc-900 transition-colors">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                  {isPromoHour(hour) && (
                    <Badge variant="neutral" className="bg-purple-100 text-purple-600 border-none text-[8px] px-1.5 py-0">PROMO</Badge>
                  )}
                </div>
                {days.map(day => (
                  <div key={day.toString()} className="p-2 border-r border-zinc-100 last:border-r-0 relative bg-white">
                    <div className="grid grid-cols-1 gap-2 h-full">
                      {filteredPitches.map(pitch => {
                        const booking = bookings.find(b => 
                          b.pitchId === pitch.id && 
                          b.startTime.getHours() === hour &&
                          isSameDay(b.startTime, day) &&
                          b.status === 'confirmed'
                        );

                        const isOccupied = !!booking;
                        const isPromo = isPromoHour(hour);
                        const isOwnBooking = booking?.userId === user.id;
                        const canSeeDetails = user.role === 'admin' || isOwnBooking;

                        // Availability urgency
                        const totalPitches = pitches.length;
                        const occupiedPitches = bookings.filter(b => 
                          b.startTime.getHours() === hour && 
                          isSameDay(b.startTime, day) && 
                          b.status === 'confirmed'
                        ).length;
                        const isLowAvailability = totalPitches - occupiedPitches === 1;

                        return (
                          <motion.div
                            key={`${pitch.id}-${hour}-${day.toISOString()}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative"
                            onMouseEnter={() => !isOccupied && setHoveredSlot({ hour, day, pitch })}
                            onMouseLeave={() => setHoveredSlot(null)}
                          >
                            <div
                              role="button"
                              tabIndex={isOccupied && !canSeeDetails ? -1 : 0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  if (isOccupied) {
                                    if (canSeeDetails) setSelectedBooking(booking);
                                  } else {
                                    setBookingData({
                                      ...bookingData,
                                      pitch,
                                      date: day,
                                      time: `${hour.toString().padStart(2, '0')}:00`
                                    });
                                    setIsBookingModalOpen(true);
                                  }
                                }
                              }}
                              onClick={() => {
                                if (isOccupied) {
                                  if (canSeeDetails) setSelectedBooking(booking);
                                } else {
                                  setBookingData({
                                    ...bookingData,
                                    pitch,
                                    date: day,
                                    time: `${hour.toString().padStart(2, '0')}:00`
                                  });
                                  setIsBookingModalOpen(true);
                                }
                              }}
                              className={cn(
                                "w-full h-full p-3 rounded-2xl text-left transition-all relative overflow-hidden group/slot flex flex-col justify-between border-2 outline-none focus:ring-2 focus:ring-sky-500",
                                isOccupied 
                                  ? "bg-zinc-50 border-zinc-100 text-zinc-400 cursor-default" 
                                  : isPromo 
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 shadow-lg shadow-indigo-500/10 cursor-pointer"
                                    : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer",
                                !isOccupied && "hover:scale-[1.02] active:scale-95"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                  {pitch.name}
                                </span>
                                {isOccupied ? (
                                  <Badge variant="neutral" className="text-[8px] px-1.5 py-0">OCUPADO</Badge>
                                ) : isPromo ? (
                                  <Badge variant="neutral" className="bg-indigo-500 text-white border-none text-[8px] px-1.5 py-0 animate-pulse">PROMO 🔥</Badge>
                                ) : (
                                  <Badge variant="success" className="text-[8px] px-1.5 py-0">LIBRE</Badge>
                                )}
                              </div>

                              <div className="mt-2 flex items-end justify-between">
                                <div>
                                  <p className="text-xs font-black">
                                    {isOccupied ? (canSeeDetails ? booking.clientName : 'Reservado') : 'Disponible'}
                                  </p>
                                  {!isOccupied && isLowAvailability && (
                                    <p className="text-[8px] font-black text-orange-500 uppercase mt-0.5 animate-bounce">¡Último lugar!</p>
                                  )}
                                </div>
                                {!isOccupied && (
                                  <div className="text-right">
                                    <p className={cn("text-sm font-black", isPromo ? "text-indigo-600" : "text-emerald-600")}>
                                      +{isPromo ? '1.5' : '1'} pts
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Hover Card (Floating) */}
                              <AnimatePresence>
                                {hoveredSlot?.hour === hour && hoveredSlot?.pitch.id === pitch.id && isSameDay(hoveredSlot.day, day) && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute inset-0 z-20 bg-zinc-900/95 backdrop-blur-md p-4 flex flex-col justify-center items-center text-center gap-2"
                                  >
                                    <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center mb-1">
                                      <CalendarIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-xs font-black text-white uppercase tracking-widest">{hour}:00 hs</p>
                                    <p className="text-[10px] font-bold text-zinc-400">{pitch.name}</p>
                                    <div className="flex items-center gap-1 text-yellow-400">
                                      <Star className="w-3 h-3 fill-yellow-400" />
                                      <span className="text-xs font-black">+{isPromo ? '1.5' : '1'} PUNTOS</span>
                                    </div>
                                    <Button size="sm" className="w-full mt-1 h-8 text-[10px] font-black tracking-widest bg-sky-500 hover:bg-sky-400 border-none">
                                      RESERVAR AHORA
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Nueva Reserva"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-6">
          <div className="p-6 bg-sky-50 rounded-[32px] border border-sky-100 flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <CalendarIcon className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <p className="text-xs font-black text-sky-600 uppercase tracking-widest">Reserva para</p>
              <h3 className="text-xl font-black text-zinc-900">
                {bookingData.pitch?.name} - {bookingData.time} hs
              </h3>
              <p className="text-sm font-bold text-zinc-500">{format(bookingData.date, "EEEE d 'de' MMMM", { locale: es })}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre del Cliente</label>
              <input 
                type="text" 
                required
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none font-bold"
                value={bookingData.clientName}
                onChange={e => setBookingData(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
              <input 
                type="tel" 
                required
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none font-bold"
                value={bookingData.clientPhone}
                onChange={e => setBookingData(prev => ({ ...prev, clientPhone: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Comprobante de Seña (Mín. $500)</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <label 
                  htmlFor="receipt-upload"
                  className={cn(
                    "w-full px-6 py-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                    bookingData.receipt ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-sky-500 hover:bg-sky-50"
                  )}
                >
                  {bookingData.receipt ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">¡Comprobante Cargado!</p>
                    </>
                  ) : (
                    <>
                      <Download className="w-8 h-8 text-zinc-400 group-hover:text-sky-500 transition-colors" />
                      <div className="text-center">
                        <p className="text-sm font-black text-zinc-900">Subir Comprobante</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Imagen o PDF (Máx 2MB)</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Monto de la Seña ($)</label>
              <input 
                type="number" 
                placeholder="Ej: 1000"
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none font-bold"
                value={bookingData.depositAmount}
                onChange={e => setBookingData(prev => ({ ...prev, depositAmount: e.target.value }))}
              />
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-[32px] text-white flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sumarás</p>
              <p className="text-2xl font-black text-sky-400">+{isPromoHour(parseInt(bookingData.time)) ? '1.5' : '1'} Puntos</p>
            </div>
            <Button type="submit" className="px-10 py-4 rounded-2xl font-black tracking-widest">
              CONFIRMAR RESERVA
            </Button>
          </div>
        </form>
      </Modal>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Detalles de la Reserva"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-6 bg-sky-50 rounded-3xl border border-sky-100">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Trophy className="w-8 h-8 text-sky-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900">{selectedBooking.clientName}</h3>
                <Badge variant="success">Reserva Confirmada</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Horario
                </p>
                <p className="font-bold text-zinc-900">
                  {format(selectedBooking.startTime, 'HH:mm')} - {format(selectedBooking.endTime, 'HH:mm')} hs
                </p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> Fecha
                </p>
                <p className="font-bold text-zinc-900">
                  {format(selectedBooking.startTime, "d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </p>
                <p className="font-bold text-zinc-900">{selectedBooking.clientPhone}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Cancha
                </p>
                <p className="font-bold text-zinc-900">
                  {pitches.find(p => p.id === selectedBooking.pitchId)?.name}
                </p>
              </div>
              {selectedBooking.depositAmount && (
                <div className="p-4 bg-sky-500/5 rounded-2xl space-y-1 border border-sky-500/20">
                  <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Seña
                  </p>
                  <p className="font-black text-sky-600 text-lg">
                    ${selectedBooking.depositAmount}
                  </p>
                </div>
              )}
            </div>

            {selectedBooking.receiptUrl && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Comprobante de Pago</p>
                <div className="relative group aspect-video rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                  {selectedBooking.receiptUrl.startsWith('data:application/pdf') ? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">Archivo PDF</p>
                        <p className="text-xs text-zinc-500">Haz clic para descargar o ver</p>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-xl mt-2"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedBooking.receiptUrl!;
                          link.download = `comprobante-${selectedBooking.clientName}.pdf`;
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
                        src={selectedBooking.receiptUrl} 
                        alt="Comprobante" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="rounded-xl"
                          onClick={() => window.open(selectedBooking.receiptUrl, '_blank')}
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

            {user.role === 'admin' && (
              <div className="pt-4 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 py-4 border-red-100 text-red-500 hover:bg-red-50"
                  onClick={() => setIsConfirmCancelOpen(true)}
                >
                  Cancelar Reserva
                </Button>
                <Button className="flex-1 py-4">Editar Datos</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isConfirmCancelOpen}
        onClose={() => setIsConfirmCancelOpen(false)}
        onConfirm={async () => {
          if (selectedBooking) {
            await api.cancelBooking(selectedBooking.id);
            setBookings(dataService.getBookings());
            setSelectedBooking(null);
          }
        }}
        title="Cancelar Reserva"
        message="¿Estás seguro de que deseas cancelar esta reserva? El turno quedará disponible nuevamente."
        confirmText="CANCELAR TURNO"
        cancelText="VOLVER"
      />
    </div>
  );
}
