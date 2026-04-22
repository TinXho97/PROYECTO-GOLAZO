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
  Star,
  Plus,
  Share2,
  Timer,
  Activity,
  Settings,
  Banknote
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
  initialBookingId?: string | null;
  onClearInitialBooking?: () => void;
}

import { ShareAvailabilityModal } from '../components/ShareAvailabilityModal';

export default function CalendarPage({ user, initialBookingId, onClearInitialBooking }: CalendarProps) {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [filterPitch, setFilterPitch] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<{ hour: number, day: Date, pitch: Pitch } | null>(null);
  const [sharePitchId, setSharePitchId] = useState<string | null>(null);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingTimer, setBookingTimer] = useState<number | null>(null);
  const [bookingData, setBookingData] = useState({
    pitch: null as Pitch | null,
    date: new Date(),
    time: '',
    clientName: user.role === 'client' ? user.name : '',
    clientPhone: '',
    receipt: null as string | null,
    depositAmount: '',
    paymentMethod: 'transferencia' as 'transferencia' | 'mercadopago',
    paymentUrl: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const clientId = user.client_id;
      const [fetchedPitches, fetchedBookings, fetchedDeactivated] = await Promise.all([
        dataService.getPitches(clientId),
        dataService.getBookings(clientId),
        dataService.getDeactivatedSlots(clientId)
      ]);
      setPitches(fetchedPitches);
      setBookings(fetchedBookings);
      setDeactivatedSlots(fetchedDeactivated);
      
      if (initialBookingId) {
        const booking = fetchedBookings.find(bk => bk.id === initialBookingId);
        if (booking) {
          setSelectedDate(booking.startTime);
          setSelectedBooking(booking);
        }
        if (onClearInitialBooking) {
          onClearInitialBooking();
        }
      }
    };
    fetchData();
  }, [initialBookingId, user.client_id]);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const [isManagementMode, setIsManagementMode] = useState(false);
  const [deactivatedSlots, setDeactivatedSlots] = useState<Set<string>>(new Set());
  
  const getSlotStatus = (date: Date, hour: number, pitchId: string) => {
    const slotKey = `${format(date, 'yyyy-MM-dd')}-${hour}-${pitchId}`;
    if (deactivatedSlots.has(slotKey)) return 'deactivated';

    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    
    const isPast = slotDate < currentTime;
    
    const booking = bookings.find(b => 
      b.pitchId === pitchId && 
      isSameDay(b.startTime, date) && 
      b.startTime.getHours() === hour &&
      (b.status === 'confirmed' || b.status === 'pending' || b.status === 'completed')
    );

    if (booking) {
      if (booking.isPaid || booking.status === 'completed') return 'occupied';
      return 'partial';
    }
    
    if (isPast) return 'past';
    return 'available';
  };

  const hours = Array.from({ length: 15 }, (_, i) => (i + 10) % 24); // 10:00 to 01:00
  
  const days = view === 'day' 
    ? [selectedDate] 
    : eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      });

  useEffect(() => {
    if (view === 'week' && filterPitch === 'all' && pitches.length > 0) {
      setFilterPitch(pitches[0].id);
    }
  }, [view, filterPitch, pitches]);

  const filteredPitches = filterPitch === 'all' 
    ? pitches 
    : pitches.filter(p => p.id === filterPitch);

  const isPromoHour = (hour: number) => hour >= 10 && hour <= 16;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBookingModalOpen && bookingTimer !== null && bookingTimer > 0) {
      interval = setInterval(() => {
        setBookingTimer(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (isBookingModalOpen && bookingTimer === 0) {
      setIsBookingModalOpen(false);
      setBookingTimer(null);
      toast.error("Tiempo de reserva agotado. El turno ha sido liberado.");
    }
    return () => clearInterval(interval);
  }, [isBookingModalOpen, bookingTimer]);

  useEffect(() => {
    if (!isBookingModalOpen) {
      setBookingTimer(null);
    }
  }, [isBookingModalOpen]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.pitch || !bookingData.time) return;

    const deposit = Number(bookingData.depositAmount) || 0;
    if (deposit < 500) {
      toast.error('La seña mínima es de $500.');
      return;
    }

    if (bookingData.paymentMethod === 'transferencia' && !bookingData.receipt) {
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
      const clientId = user.client_id;

      await api.addBooking({
        pitchId: bookingData.pitch.id,
        userId: user.id,
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        startTime,
        endTime,
        status: 'confirmed',
        receiptUrl: bookingData.receipt || undefined,
        depositAmount: Number(bookingData.depositAmount) || 0,
        paymentUrl: bookingData.paymentMethod === 'mercadopago' ? bookingData.paymentUrl : undefined
      });
      
      const updatedBookings = await dataService.getBookings(clientId);
      setBookings(updatedBookings);
      setIsBookingModalOpen(false);
      setBookingData(prev => ({ 
        ...prev, 
        receipt: null, 
        depositAmount: '',
        paymentMethod: 'transferencia',
        paymentUrl: ''
      }));
      
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
    <div className="space-y-6">
      {/* Header: Editorial & Professional */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-sky-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-sky-200 rotate-3 hover:rotate-0 transition-transform duration-500">
            <CalendarIcon className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-zinc-900 mb-1 italic">Calendario</h1>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">Actualizado en tiempo real</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-zinc-100 p-2 rounded-[24px] border border-zinc-200 shadow-inner">
            <button
              onClick={() => setView('day')}
              className={cn(
                "px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                view === 'day' ? "bg-white text-zinc-900 shadow-xl" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Día
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                "px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                view === 'week' ? "bg-white text-zinc-900 shadow-xl" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Semana
            </button>
          </div>
          
          {user.role === 'admin' && (
            <Button 
              className={cn(
                "h-16 px-10 rounded-[24px] gap-4 font-black text-[11px] uppercase tracking-widest transition-all hover:-translate-y-1 active:translate-y-0 border-2",
                isManagementMode 
                  ? "bg-amber-500 border-amber-500 text-white shadow-2xl shadow-amber-200" 
                  : "bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800 shadow-2xl shadow-zinc-900/20"
              )}
              onClick={() => setIsManagementMode(!isManagementMode)}
            >
              <Settings className={cn("w-5 h-5", isManagementMode && "animate-spin-slow")} />
              {isManagementMode ? 'Modo Gestión ON' : 'Gestionar Horarios'}
            </Button>
          )}

          <Button 
            className="h-16 px-10 rounded-[24px] bg-sky-600 text-white hover:bg-sky-700 shadow-2xl shadow-sky-200 gap-4 font-black text-[11px] uppercase tracking-widest transition-all hover:-translate-y-1 active:translate-y-0"
            onClick={() => {
              setBookingData({
                ...bookingData,
                pitch: pitches[0] || null,
                date: new Date(),
                time: "18:00"
              });
              setIsBookingModalOpen(true);
            }}
          >
            <Plus className="w-5 h-5" />
            Nueva Reserva
          </Button>
        </div>
      </header>

      {/* Navigation & Filters Bar: Clean Utility */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6 bg-white p-6 rounded-[40px] border border-zinc-100 shadow-2xl shadow-zinc-200/20">
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
          <div className="flex items-center bg-zinc-50 rounded-[24px] border border-zinc-200 p-2 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              className="h-12 w-12 p-0 rounded-xl hover:bg-white hover:shadow-md transition-all" 
              onClick={() => setSelectedDate(d => addDays(d, view === 'day' ? -1 : -7))}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <button 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex-1 sm:flex-none px-8 text-sm font-black text-zinc-900 min-w-[200px] text-center hover:bg-white hover:shadow-md h-12 rounded-xl transition-all flex items-center justify-center gap-3 relative"
            >
              <CalendarIcon className="w-4 h-4 text-sky-500" />
              {view === 'day' 
                ? format(selectedDate, "d 'de' MMMM", { locale: es })
                : `${format(days[0], "d MMM")} - ${format(days[6], "d MMM")}`
              }
              
              <AnimatePresence>
                {isCalendarOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-6 z-50 bg-white border border-zinc-200 rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] p-8 pointer-events-auto"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <Button 
              variant="ghost" 
              className="h-12 w-12 p-0 rounded-xl hover:bg-white hover:shadow-md transition-all" 
              onClick={() => setSelectedDate(d => addDays(d, view === 'day' ? 1 : 7))}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          <Button 
            variant="outline" 
            className="h-16 px-10 rounded-[24px] border-zinc-200 font-black text-[11px] uppercase tracking-widest hover:bg-zinc-50 w-full sm:w-auto"
            onClick={() => setSelectedDate(new Date())}
          >
            HOY
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <select
              className="w-full bg-zinc-50 pl-14 pr-8 h-16 rounded-[24px] border border-zinc-200 font-black text-[11px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-sky-500/10 appearance-none cursor-pointer hover:bg-white transition-all"
              value={filterPitch}
              onChange={e => setFilterPitch(e.target.value)}
            >
              <option value="all">Todas las canchas</option>
              {pitches.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {user.role === 'admin' && (
            <Button 
              variant="outline" 
              className="h-16 px-10 rounded-[24px] border-zinc-200 font-black text-[11px] uppercase tracking-widest gap-4 w-full sm:w-auto hover:bg-zinc-50"
              onClick={() => {
                if (filterPitch !== 'all') {
                  setSharePitchId(filterPitch);
                } else {
                  // If 'all' is selected, default to the first pitch to open the modal
                  // The user can then select the pitch in the modal (we will add a selector there)
                  setSharePitchId(pitches[0]?.id || null);
                }
              }}
            >
              <Share2 className="w-5 h-5" />
              Compartir Disp.
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid & Mobile List View */}
      <div className="space-y-6">
        {/* Desktop Grid View */}
        <div className="hidden md:block">
          <Card className="border-none shadow-2xl rounded-[32px] bg-white overflow-hidden border border-zinc-100">
            <div className="w-full overflow-x-auto custom-scrollbar">
              <div className="min-w-[1000px] lg:min-w-full relative">
                {/* Header Row */}
                <div 
                  className="grid border-b border-zinc-100 bg-zinc-50/80 backdrop-blur-md sticky top-0 z-40"
                  style={{ 
                    gridTemplateColumns: view === 'day' 
                      ? `120px repeat(${filteredPitches.length}, 1fr)` 
                      : `120px repeat(7, 1fr)` 
                  }}
                >
                  <div className="p-6 flex flex-col items-center justify-center border-r border-zinc-100 bg-white">
                    <Clock className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hora</span>
                  </div>
                  {view === 'day' ? (
                    filteredPitches.map(pitch => (
                      <div key={pitch.id} className="p-6 text-center border-r border-zinc-100 last:border-r-0 transition-all relative group">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-sky-600 mb-1">{pitch.type}</p>
                        <p className="text-xl font-black tracking-tight text-zinc-900">{pitch.name}</p>
                        {user.role === 'admin' && (
                          <button
                            onClick={() => setSharePitchId(pitch.id)}
                            className="absolute top-4 right-4 p-2 bg-zinc-100 text-zinc-500 hover:bg-sky-100 hover:text-sky-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            title="Compartir Disponibilidad"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    days.map(day => (
                      <div key={day.toISOString()} className="p-6 text-center border-r border-zinc-100 last:border-r-0 transition-all">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-sky-600 mb-1">{format(day, 'EEE', { locale: es })}</p>
                        <p className="text-xl font-black tracking-tight text-zinc-900">{format(day, 'd MMM')}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Time Rows */}
                <div className="divide-y divide-zinc-100">
                  {hours.map(hour => (
                    <div 
                      key={hour} 
                      className="grid group/row min-h-[80px]"
                      style={{ 
                        gridTemplateColumns: view === 'day' 
                          ? `120px repeat(${filteredPitches.length}, 1fr)` 
                          : `120px repeat(7, 1fr)` 
                      }}
                    >
                      <div className={cn(
                        "p-6 border-r border-zinc-100 bg-white flex items-center justify-center sticky left-0 z-20 transition-colors duration-500",
                        isSameDay(selectedDate, currentTime) && currentTime.getHours() === hour && "bg-sky-50/50"
                      )}>
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-lg font-black transition-all duration-300",
                            isSameDay(selectedDate, currentTime) && currentTime.getHours() === hour ? "text-sky-600 scale-110" : "text-zinc-400 group-hover/row:text-zinc-900"
                          )}>
                            {hour.toString().padStart(2, '0')}:00
                          </span>
                          {isPromoHour(hour) && (
                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter mt-1 flex items-center gap-0.5">
                              <Zap className="w-2 h-2 fill-amber-500" />
                              Promo
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {view === 'day' ? (
                        filteredPitches.map(pitch => {
                          const status = getSlotStatus(selectedDate, hour, pitch.id);
                          const booking = bookings.find(b => 
                            b.pitchId === pitch.id && 
                            isSameDay(b.startTime, selectedDate) && 
                            b.startTime.getHours() === hour &&
                            b.status === 'confirmed'
                          );

                          const isOccupied = status === 'occupied' || status === 'partial';
                          const isPast = status === 'past';
                          const isAvailable = status === 'available';
                          const isPartial = status === 'partial';
                          const canSeeDetails = user.role === 'admin' || booking?.userId === user.id;

                          return (
                            <div key={pitch.id} className="p-2 border-r border-zinc-100 last:border-r-0 relative bg-white group/cell">
                              <motion.button
                                whileHover={!isPast ? { scale: 1.02, y: -2 } : {}}
                                whileTap={!isPast ? { scale: 0.98 } : {}}
                                disabled={isPast}
                                onClick={() => {
                                  if (isManagementMode) {
                                    const slotKey = `${format(selectedDate, 'yyyy-MM-dd')}-${hour}-${pitch.id}`;
                                    setDeactivatedSlots(prev => {
                                      const next = new Set(prev);
                                      if (next.has(slotKey)) next.delete(slotKey);
                                      else next.add(slotKey);
                                      return next;
                                    });
                                    toast.info(deactivatedSlots.has(slotKey) ? 'Horario activado' : 'Horario desactivado');
                                    return;
                                  }

                                  if (isOccupied) {
                                    if (canSeeDetails && booking) setSelectedBooking(booking);
                                  } else if (!isPast && status !== 'deactivated') {
                                    setBookingData({
                                      ...bookingData,
                                      pitch,
                                      date: selectedDate,
                                      time: `${hour.toString().padStart(2, '0')}:00`
                                    });
                                    setBookingTimer(300);
                                    setIsBookingModalOpen(true);
                                  }
                                }}
                                className={cn(
                                  "w-full h-full min-h-[60px] p-3 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-center border-2",
                                  isPast && "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed grayscale",
                                  status === 'deactivated' && "bg-zinc-200 border-zinc-300 text-zinc-500 opacity-50",
                                  isOccupied && !isPartial && "bg-red-50 border-red-100 text-red-700 hover:bg-red-100/50",
                                  isPartial && "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100/50",
                                  isAvailable && "bg-emerald-50 border-emerald-100 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100/50 shadow-sm",
                                  isManagementMode && "ring-2 ring-amber-500/20"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full",
                                      isPast ? "bg-zinc-300" : status === 'deactivated' ? "bg-zinc-500" : isOccupied && !isPartial ? "bg-red-500" : isPartial ? "bg-amber-500" : "bg-emerald-500"
                                    )} />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                      {isPast ? 'PASADO' : status === 'deactivated' ? 'DESACTIVADO' : isOccupied ? (canSeeDetails ? booking?.clientName : 'OCUPADO') : 'LIBRE'}
                                    </span>
                                  </div>
                                  {isAvailable && !isManagementMode && <Plus className="w-3 h-3 opacity-40" />}
                                  {isManagementMode && <Zap className={cn("w-3 h-3", status === 'deactivated' ? "text-zinc-400" : "text-amber-500")} />}
                                  {isOccupied && booking?.isPaid && <CheckCircle2 className="w-3 h-3 text-red-500" />}
                                </div>
                                
                                {!isPast && isAvailable && !isManagementMode && (
                                  <p className="text-[10px] font-bold mt-1 opacity-60">Click para reservar</p>
                                )}
                                {isManagementMode && (
                                  <p className="text-[10px] font-bold mt-1 text-amber-600">Click para {status === 'deactivated' ? 'activar' : 'desactivar'}</p>
                                )}
                              </motion.button>
                            </div>
                          );
                        })
                      ) : (
                        days.map(day => {
                          // In week view, we use the first filtered pitch or the selected one
                          const targetPitch = filteredPitches[0] || pitches[0];
                          if (!targetPitch) return null;

                          const status = getSlotStatus(day, hour, targetPitch.id);
                          const booking = bookings.find(b => 
                            b.pitchId === targetPitch.id && 
                            isSameDay(b.startTime, day) && 
                            b.startTime.getHours() === hour &&
                            b.status === 'confirmed'
                          );

                          const isOccupied = status === 'occupied' || status === 'partial';
                          const isPast = status === 'past';
                          const isAvailable = status === 'available';
                          const isPartial = status === 'partial';
                          const canSeeDetails = user.role === 'admin' || booking?.userId === user.id;

                          return (
                            <div key={day.toISOString()} className="p-2 border-r border-zinc-100 last:border-r-0 relative bg-white group/cell">
                              <motion.button
                                whileHover={!isPast ? { scale: 1.02, y: -2 } : {}}
                                whileTap={!isPast ? { scale: 0.98 } : {}}
                                disabled={isPast}
                                onClick={() => {
                                  if (isManagementMode) {
                                    const slotKey = `${format(day, 'yyyy-MM-dd')}-${hour}-${targetPitch.id}`;
                                    setDeactivatedSlots(prev => {
                                      const next = new Set(prev);
                                      if (next.has(slotKey)) next.delete(slotKey);
                                      else next.add(slotKey);
                                      return next;
                                    });
                                    return;
                                  }

                                  if (isOccupied) {
                                    if (canSeeDetails && booking) setSelectedBooking(booking);
                                  } else if (!isPast && status !== 'deactivated') {
                                    setBookingData({
                                      ...bookingData,
                                      pitch: targetPitch,
                                      date: day,
                                      time: `${hour.toString().padStart(2, '0')}:00`
                                    });
                                    setBookingTimer(300);
                                    setIsBookingModalOpen(true);
                                  }
                                }}
                                className={cn(
                                  "w-full h-full min-h-[60px] p-3 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-center border-2",
                                  isPast && "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed grayscale",
                                  status === 'deactivated' && "bg-zinc-200 border-zinc-300 text-zinc-500 opacity-50",
                                  isOccupied && !isPartial && "bg-red-50 border-red-100 text-red-700 hover:bg-red-100/50",
                                  isPartial && "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100/50",
                                  isAvailable && "bg-emerald-50 border-emerald-100 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100/50 shadow-sm",
                                  isManagementMode && "ring-2 ring-amber-500/20"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full",
                                      isPast ? "bg-zinc-300" : status === 'deactivated' ? "bg-zinc-500" : isOccupied && !isPartial ? "bg-red-500" : isPartial ? "bg-amber-500" : "bg-emerald-500"
                                    )} />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                      {isPast ? 'PASADO' : status === 'deactivated' ? 'DESACTIVADO' : isOccupied ? (canSeeDetails ? booking?.clientName : 'OCUPADO') : 'LIBRE'}
                                    </span>
                                  </div>
                                </div>
                              </motion.button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Mobile List View: Vertical Agenda */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
              {view === 'day' ? 'Agenda del Día' : 'Agenda Semanal'}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">En vivo</span>
            </div>
          </div>

          <div className="space-y-6">
            {hours.map(hour => (
              <div key={hour} className="space-y-3">
                <div className="flex items-center gap-3 px-4 sticky top-0 bg-zinc-50/90 backdrop-blur-sm py-2 z-10">
                  <span className={cn(
                    "text-sm font-black uppercase tracking-widest",
                    isSameDay(selectedDate, currentTime) && currentTime.getHours() === hour ? "text-sky-600" : "text-zinc-900"
                  )}>
                    {hour.toString().padStart(2, '0')}:00 hs
                  </span>
                  {isPromoHour(hour) && (
                    <Badge variant="neutral" className="bg-amber-100 text-amber-700 border-none text-[8px] h-4 px-1.5 flex items-center gap-0.5">
                      <Zap className="w-2 h-2 fill-amber-700" /> PROMO
                    </Badge>
                  )}
                  <div className="h-px flex-1 bg-zinc-200" />
                </div>
                
                <div className="grid grid-cols-1 gap-3 px-4">
                  {view === 'day' ? (
                    filteredPitches.map(pitch => {
                      const status = getSlotStatus(selectedDate, hour, pitch.id);
                      const booking = bookings.find(b => 
                        b.pitchId === pitch.id && 
                        isSameDay(b.startTime, selectedDate) && 
                        b.startTime.getHours() === hour &&
                        b.status === 'confirmed'
                      );

                      const isOccupied = status === 'occupied' || status === 'partial';
                      const isPast = status === 'past';
                      const isAvailable = status === 'available';
                      const isPartial = status === 'partial';
                      const canSeeDetails = user.role === 'admin' || booking?.userId === user.id;

                      return (
                        <button
                          key={pitch.id}
                          disabled={isPast}
                          onClick={() => {
                            if (isManagementMode) {
                              const slotKey = `${format(selectedDate, 'yyyy-MM-dd')}-${hour}-${pitch.id}`;
                              setDeactivatedSlots(prev => {
                                const next = new Set(prev);
                                if (next.has(slotKey)) next.delete(slotKey);
                                else next.add(slotKey);
                                return next;
                              });
                              return;
                            }
                            if (isOccupied) {
                              if (canSeeDetails && booking) setSelectedBooking(booking);
                            } else if (!isPast && isAvailable) {
                              setBookingData({
                                ...bookingData,
                                pitch,
                                date: selectedDate,
                                time: `${hour.toString().padStart(2, '0')}:00`
                              });
                              setBookingTimer(300);
                              setIsBookingModalOpen(true);
                            }
                          }}
                          className={cn(
                            "w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between border-2",
                            isPast && "bg-zinc-100 border-zinc-200 text-zinc-400 grayscale opacity-60",
                            status === 'deactivated' && "bg-zinc-200 border-zinc-300 text-zinc-500 opacity-50",
                            isOccupied && !isPartial && "bg-red-50 border-red-100 text-red-700",
                            isPartial && "bg-amber-50 border-amber-100 text-amber-700",
                            isAvailable && "bg-white border-zinc-100 text-zinc-700 active:scale-95",
                            isManagementMode && "ring-2 ring-amber-500/20"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border",
                              isPast ? "bg-zinc-200 border-zinc-300 text-zinc-400" : 
                              status === 'deactivated' ? "bg-zinc-300 border-zinc-400 text-zinc-600" :
                              isOccupied && !isPartial ? "bg-red-100 border-red-200 text-red-600" : 
                              isPartial ? "bg-amber-100 border-amber-200 text-amber-600" :
                              "bg-emerald-100 border-emerald-200 text-emerald-600"
                            )}>
                              {pitch.type}
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">{pitch.name}</p>
                              <p className="text-sm font-black uppercase tracking-tight">
                                {isPast ? 'HORARIO PASADO' : status === 'deactivated' ? 'DESACTIVADO' : isOccupied ? (canSeeDetails ? booking?.clientName : 'RESERVADO') : 'DISPONIBLE'}
                              </p>
                            </div>
                          </div>
                          {!isPast && isAvailable && !isManagementMode && (
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <Plus className="w-4 h-4" />
                            </div>
                          )}
                          {isManagementMode && <Zap className={cn("w-5 h-5", status === 'deactivated' ? "text-zinc-400" : "text-amber-500")} />}
                        </button>
                      );
                    })
                  ) : (
                    days.map(day => {
                      const targetPitch = filteredPitches[0] || pitches[0];
                      if (!targetPitch) return null;

                      const status = getSlotStatus(day, hour, targetPitch.id);
                      const booking = bookings.find(b => 
                        b.pitchId === targetPitch.id && 
                        isSameDay(b.startTime, day) && 
                        b.startTime.getHours() === hour &&
                        b.status === 'confirmed'
                      );

                      const isOccupied = status === 'occupied' || status === 'partial';
                      const isPast = status === 'past';
                      const isAvailable = status === 'available';
                      const isPartial = status === 'partial';
                      const canSeeDetails = user.role === 'admin' || booking?.userId === user.id;

                      return (
                        <button
                          key={day.toISOString()}
                          disabled={isPast}
                          onClick={() => {
                            if (isManagementMode) {
                              const slotKey = `${format(day, 'yyyy-MM-dd')}-${hour}-${targetPitch.id}`;
                              setDeactivatedSlots(prev => {
                                const next = new Set(prev);
                                if (next.has(slotKey)) next.delete(slotKey);
                                else next.add(slotKey);
                                return next;
                              });
                              return;
                            }
                            if (isOccupied) {
                              if (canSeeDetails && booking) setSelectedBooking(booking);
                            } else if (!isPast && isAvailable) {
                              setBookingData({
                                ...bookingData,
                                pitch: targetPitch,
                                date: day,
                                time: `${hour.toString().padStart(2, '0')}:00`
                              });
                              setBookingTimer(300);
                              setIsBookingModalOpen(true);
                            }
                          }}
                          className={cn(
                            "w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between border-2",
                            isPast && "bg-zinc-100 border-zinc-200 text-zinc-400 grayscale opacity-60",
                            status === 'deactivated' && "bg-zinc-200 border-zinc-300 text-zinc-500 opacity-50",
                            isOccupied && !isPartial && "bg-red-50 border-red-100 text-red-700",
                            isPartial && "bg-amber-50 border-amber-100 text-amber-700",
                            isAvailable && "bg-white border-zinc-100 text-zinc-700 active:scale-95",
                            isManagementMode && "ring-2 ring-amber-500/20"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border",
                              isPast ? "bg-zinc-200 border-zinc-300 text-zinc-400" : 
                              status === 'deactivated' ? "bg-zinc-300 border-zinc-400 text-zinc-600" :
                              isOccupied && !isPartial ? "bg-red-100 border-red-200 text-red-600" : 
                              isPartial ? "bg-amber-100 border-amber-200 text-amber-600" :
                              "bg-emerald-100 border-emerald-200 text-emerald-600"
                            )}>
                              {format(day, 'EE', { locale: es })}
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">{format(day, 'd MMM', { locale: es })}</p>
                              <p className="text-sm font-black uppercase tracking-tight">
                                {isPast ? 'HORARIO PASADO' : status === 'deactivated' ? 'DESACTIVADO' : isOccupied ? (canSeeDetails ? booking?.clientName : 'RESERVADO') : 'DISPONIBLE'}
                              </p>
                            </div>
                          </div>
                          {!isPast && isAvailable && !isManagementMode && (
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <Plus className="w-4 h-4" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Nueva Reserva"
      >
        {bookingTimer !== null && (
          <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-2xl border border-red-100 mb-6 animate-pulse">
            <Timer className="w-5 h-5" />
            <span className="font-black tracking-widest uppercase text-xs">
              Tiempo restante: {Math.floor(bookingTimer / 60)}:{(bookingTimer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
        <form onSubmit={handleBookingSubmit} className="space-y-6">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Detalles del turno</p>
              <h3 className="text-base font-bold text-zinc-900">
                {bookingData.pitch?.name} • {bookingData.time} hs
              </h3>
              <p className="text-xs text-zinc-500">{format(bookingData.date, "EEEE d 'de' MMMM", { locale: es })}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 ml-1">Nombre del Cliente</label>
              <input 
                type="text" 
                required
                placeholder="Ej: Juan Pérez"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                value={bookingData.clientName}
                onChange={e => setBookingData(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 ml-1">Teléfono</label>
              <input 
                type="tel" 
                required
                placeholder="Ej: 11 2345 6789"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                value={bookingData.clientPhone}
                onChange={e => setBookingData(prev => ({ ...prev, clientPhone: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 ml-1">Método de pago de seña</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBookingData({ ...bookingData, paymentMethod: 'transferencia' })}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                  bookingData.paymentMethod === 'transferencia' 
                    ? "bg-sky-50 text-sky-600 border-sky-200" 
                    : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                )}
              >
                Transferencia
              </button>
              <button
                type="button"
                onClick={() => setBookingData({ ...bookingData, paymentMethod: 'mercadopago' })}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                  bookingData.paymentMethod === 'mercadopago' 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                    : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                )}
              >
                Efectivo
              </button>
            </div>
          </div>

          {bookingData.paymentMethod === 'transferencia' ? (
            <div className="space-y-3">
              <div className="bg-sky-50/50 p-3 rounded-2xl border border-sky-100 space-y-2">
                <p className="text-xs font-bold text-sky-800">Datos Bancarios</p>
                <div className="text-[11px] text-sky-700 space-y-1">
                  <p><span className="font-semibold">Banco:</span> Banco Nación</p>
                  <p><span className="font-semibold">Titular:</span> Complejo Golazo</p>
                  <p><span className="font-semibold">CBU:</span> 1234567890123456789012</p>
                  <p><span className="font-semibold">Alias:</span> GOLAZO.CANCHA</p>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 ml-1">Comprobante de Seña (Mín. $500)</label>
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
                      "w-full px-4 py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all",
                      bookingData.receipt ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    {bookingData.receipt ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <p className="text-[10px] font-bold text-emerald-600">¡Comprobante Cargado!</p>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-zinc-900">Subir Comprobante</p>
                          <p className="text-[9px] text-zinc-500">Imagen o PDF (Máx 2MB)</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xs font-medium text-emerald-800">
                El pago se realiza en la cancha antes del turno
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 ml-1">Monto de la Seña ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                value={bookingData.depositAmount}
                onChange={e => setBookingData(prev => ({ ...prev, depositAmount: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="w-4 h-4 fill-primary" />
              <span className="text-xs font-bold">+{isPromoHour(parseInt(bookingData.time)) ? '1.5' : '1'} Puntos</span>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsBookingModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="px-8 shadow-lg shadow-primary/20">
                Confirmar Reserva
              </Button>
            </div>
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
            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900">{selectedBooking.clientName}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-none">Confirmada</Badge>
                  {selectedBooking.isPaid ? (
                    <Badge variant="success" className="bg-blue-100 text-blue-700 border-none flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Pagado
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="bg-amber-100 text-amber-700 border-none flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Pendiente
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Playing Now Alert */}
            {new Date() >= selectedBooking.startTime && new Date() <= selectedBooking.endTime && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">¡Partido en Juego!</p>
                  <p className="text-xs text-amber-700">El partido se está jugando ahora. Asegúrate de cobrar el saldo pendiente.</p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Horario
                </p>
                <p className="text-sm font-bold text-zinc-900">
                  {format(selectedBooking.startTime, 'HH:mm')} - {format(selectedBooking.endTime, 'HH:mm')} hs
                </p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> Fecha
                </p>
                <p className="text-sm font-bold text-zinc-900">
                  {format(selectedBooking.startTime, "d 'de' MMM", { locale: es })}
                </p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-zinc-900">{selectedBooking.clientPhone}</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-6 px-2 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 rounded-lg"
                    onClick={() => window.open(`https://wa.me/${selectedBooking.clientPhone.replace(/\D/g, '')}`, '_blank')}
                  >
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Cancha
                </p>
                <p className="text-sm font-bold text-zinc-900">
                  {pitches.find(p => p.id === selectedBooking.pitchId)?.name}
                </p>
              </div>
            </div>

            {selectedBooking.depositAmount && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-zinc-700">Seña abonada</span>
                </div>
                <span className="text-lg font-bold text-primary">${selectedBooking.depositAmount}</span>
              </div>
            )}

            {selectedBooking.paymentUrl && (
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  </div>
                  <span className="text-sm font-bold text-zinc-700">Ref. Mercado Pago</span>
                </div>
                <span className="text-sm font-bold text-sky-600">{selectedBooking.paymentUrl}</span>
              </div>
            )}

            {selectedBooking.receiptUrl && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Comprobante</p>
                <div className="relative group aspect-video rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                  {selectedBooking.receiptUrl.startsWith('data:application/pdf') ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <FileText className="w-8 h-8 text-red-500" />
                      <p className="text-xs font-bold text-zinc-900">Archivo PDF</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 text-[10px]"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedBooking.receiptUrl!;
                          link.download = `comprobante-${selectedBooking.clientName}.pdf`;
                          link.click();
                        }}
                      >
                        Descargar
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
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 text-[10px]"
                          onClick={() => setSelectedReceipt(selectedBooking.receiptUrl!)}
                        >
                          Ver Completo
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {user.role === 'admin' && (
              <div className="pt-4 flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button 
                    variant={selectedBooking.isPaid ? "outline" : "primary"}
                    className={cn(
                      "flex-1 font-bold",
                      selectedBooking.isPaid ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                    onClick={async () => {
                      await api.toggleBookingPayment(selectedBooking.id, user.client_id);
                      const updatedBookings = await dataService.getBookings(user.client_id);
                      setBookings(updatedBookings);
                      setSelectedBooking(prev => prev ? { ...prev, isPaid: !prev.isPaid } : null);
                      toast.success(selectedBooking.isPaid ? 'Pago cancelado' : '¡Pago registrado!');
                    }}
                  >
                    {selectedBooking.isPaid ? 'Marcar como Pendiente' : 'Marcar como Pagado'}
                  </Button>
                  <Button className="flex-1 font-bold">Editar</Button>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full text-red-500 hover:bg-red-50 font-bold"
                  onClick={() => setIsConfirmCancelOpen(true)}
                >
                  Cancelar Reserva
                </Button>
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
            await api.cancelBooking(selectedBooking.id, user.client_id);
            const updatedBookings = await dataService.getBookings(user.client_id);
            setBookings(updatedBookings);
            setSelectedBooking(null);
          }
        }}
        title="Cancelar Reserva"
        message="¿Estás seguro de que deseas cancelar esta reserva? El turno quedará disponible nuevamente."
        confirmText="CANCELAR TURNO"
        cancelText="VOLVER"
      />

      <ShareAvailabilityModal
        isOpen={sharePitchId !== null}
        onClose={() => setSharePitchId(null)}
        pitch={pitches.find(p => p.id === sharePitchId) || null}
        pitches={pitches}
        onPitchChange={setSharePitchId}
        bookings={bookings}
        selectedDate={selectedDate}
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
