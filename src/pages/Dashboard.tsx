import React, { useState, useEffect, useRef } from 'react';
import { format, addHours, isSameDay, startOfMonth, endOfMonth, startOfWeek, addDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  Trophy,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Share2,
  Upload,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { domToPng } from 'modern-screenshot';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { dataService, api } from '../services/dataService';
import { Pitch, Booking, User as UserType, Sale } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  user: UserType;
}

export default function Dashboard({ user }: DashboardProps) {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [isCompact, setIsCompact] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false);
  const [isPitchScheduleModalOpen, setIsPitchScheduleModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    clientName: user.role === 'client' ? user.name : '',
    clientPhone: '',
    receipt: null as string | null,
    depositAmount: ''
  });

  useEffect(() => {
    setPitches(dataService.getPitches());
    setBookings(dataService.getBookings());
    setSales(dataService.getSales());
  }, [selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPitch || !selectedTime) return;

    if (!formData.receipt) {
      alert('Por favor, carga el comprobante de la seña.');
      return;
    }

    const [h, m] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(h, m, 0, 0);
    const endTime = addHours(startTime, 1);

    try {
      await api.addBooking({
        pitchId: selectedPitch.id,
        userId: user.id,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        startTime,
        endTime,
        status: 'confirmed',
        receiptUrl: formData.receipt,
        depositAmount: Number(formData.depositAmount) || 0
      });
      setBookings(dataService.getBookings());
      setIsBookingModalOpen(false);
      setFormData({ 
        clientName: user.role === 'client' ? user.name : '', 
        clientPhone: '', 
        receipt: null, 
        depositAmount: '' 
      });
      alert('Reserva confirmada con éxito.');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, receipt: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const shareAvailability = async () => {
    if (!gridRef.current) return;
    setIsSharing(true);
    try {
      const image = await domToPng(gridRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `disponibilidad-${format(selectedDate, 'dd-MM-yyyy')}.png`;
      link.href = image;
      link.click();

      const availableSlots = pitches.map(p => {
        const slots = hours.filter(h => !bookings.some(b => 
          b.pitchId === p.id && 
          b.startTime.getHours() === h && 
          isSameDay(b.startTime, selectedDate) && 
          b.status === 'confirmed'
        )).map(h => `${h.toString().padStart(2, '0')}:00`);
        return `*${p.name}*: ${slots.join(', ')}`;
      }).join('\n');

      const text = encodeURIComponent(`⚽ *Disponibilidad El Golazo - ${format(selectedDate, 'dd/MM/yyyy')}*\n\n${availableSlots}\n\n¡Reserva tu turno ahora!`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getPitchStatus = (pitchId: string) => {
    const now = new Date();
    const currentBooking = bookings.find(b => 
      b.pitchId === pitchId && 
      now >= b.startTime && 
      now < b.endTime &&
      b.status === 'confirmed'
    );
    return currentBooking ? 'busy' : 'available';
  };

  // Metrics
  const todayBookings = bookings.filter(b => isSameDay(b.startTime, new Date()) && b.status === 'confirmed');
  const todayIncome = todayBookings.reduce((acc, b) => {
    const pitch = pitches.find(p => p.id === b.pitchId);
    return acc + (pitch?.price || 0);
  }, 0);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthBookings = bookings.filter(b => b.startTime >= monthStart && b.startTime <= monthEnd && b.status === 'confirmed');
  const monthIncome = monthBookings.reduce((acc, b) => {
    const pitch = pitches.find(p => p.id === b.pitchId);
    return acc + (pitch?.price || 0);
  }, 0);

  const occupiedPitchesCount = pitches.filter(p => getPitchStatus(p.id) === 'busy').length;
  const userPoints = dataService.getUserPoints(user.id);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 14) % 24); // 14:00 to 01:00 (starts at 00:00)

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6)
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter flex items-center gap-3">
            Inicio ⚽
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Bienvenido de nuevo, {user.name}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {user.role === 'admin' && (
            <Button 
              onClick={shareAvailability} 
              disabled={isSharing}
              className="gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-2xl"
            >
              <Share2 className="w-4 h-4" />
              {isSharing ? 'Generando...' : 'Compartir Disponibilidad'}
            </Button>
          )}
          {/* View Toggles */}
          <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'day' ? "bg-green-500 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'week' ? "bg-green-500 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={cn(
                "p-2 rounded-xl transition-all",
                isCompact ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
              title={isCompact ? "Vista Normal" : "Vista Compacta"}
            >
              {isCompact ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => addDays(d, -1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <button 
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="px-4 font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 py-1 rounded-xl transition-colors"
              >
                <CalendarIcon className="w-4 h-4 text-green-500" />
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => addDays(d, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {isCalendarOpen && (
              <div className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-2xl p-4">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }}
                  locale={es}
                  className="rdp-custom dark"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Turnos Hoy', value: todayBookings.length, icon: CalendarIcon, color: 'bg-blue-500', show: user.role === 'admin' },
          { label: 'Ingresos Hoy', value: `$${todayIncome}`, icon: DollarSign, color: 'bg-green-500', show: user.role === 'admin' },
          { label: 'Ingresos Mes', value: `$${monthIncome}`, icon: TrendingUp, color: 'bg-purple-500', show: user.role === 'admin' },
          { label: 'Canchas Ocupadas', value: `${occupiedPitchesCount}/${pitches.length}`, icon: Activity, color: 'bg-orange-500', show: user.role === 'admin' },
          { label: 'Mis Puntos', value: userPoints, icon: Trophy, color: 'bg-yellow-500', show: user.role === 'client' },
        ].filter(s => s.show).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
              <div className="text-right">
                <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{stat.value}</p>
              </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Pitches Grid */}
      <div className="space-y-4" ref={gridRef}>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          {viewMode === 'day' ? 'Disponibilidad de Canchas' : 'Vista Semanal'}
        </h2>
        
        {viewMode === 'day' ? (
          <section className={cn(
            "grid gap-6",
            isCompact ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}>
            {pitches.map((pitch) => {
              const status = getPitchStatus(pitch.id);
              return (
                <motion.div key={pitch.id} layout>
              <Card 
                className="h-full border-none shadow-sm hover:shadow-xl transition-all group bg-white dark:bg-zinc-900 cursor-pointer"
                onClick={() => {
                  setSelectedPitch(pitch);
                  setIsPitchScheduleModalOpen(true);
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <h3 className={cn(
                      "font-black text-zinc-900 dark:text-zinc-100 group-hover:text-green-600 transition-colors",
                      isCompact ? "text-lg" : "text-xl"
                    )}>{pitch.name}</h3>
                    <Badge variant={status === 'available' ? 'success' : 'danger'} className="mt-1">
                      {status === 'available' ? 'Disponible' : 'En Juego'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{pitch.type}</span>
                    <p className={cn("font-black text-green-600 dark:text-green-500", isCompact ? "text-base" : "text-lg")}>${pitch.price}</p>
                  </div>
                </CardHeader>
                    <CardContent className={isCompact ? "p-4" : "p-6"}>
                      <div className="space-y-4">
                        {!isCompact && (
                          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all duration-1000", status === 'available' ? 'w-0' : 'w-full bg-red-500')} 
                            />
                          </div>
                        )}
                        <div className="pt-4">
                          <Button className="w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-green-500/20 group-hover:scale-[1.02] transition-transform">
                            Ver Horarios Disponibles
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </section>
        ) : (
          <section className="space-y-6">
            {pitches.map((pitch) => (
              <Card key={pitch.id} className="border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{pitch.name}</h3>
                    <span className="text-sm font-bold text-green-600 dark:text-green-500">${pitch.price} / hora</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-8 border-b dark:border-zinc-800">
                      <div className="p-4 border-r dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 font-bold text-zinc-400 text-xs uppercase tracking-widest">Hora</div>
                      {weekDays.map(day => (
                        <div key={day.toISOString()} className="p-4 text-center border-r dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                          <p className="text-xs font-black text-zinc-400 uppercase">{format(day, 'EEE', { locale: es })}</p>
                          <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{format(day, 'd')}</p>
                        </div>
                      ))}
                    </div>
                    {hours.map(hour => {
                      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                      return (
                        <div key={hour} className="grid grid-cols-8 border-b dark:border-zinc-800 last:border-0">
                          <div className="p-4 border-r dark:border-zinc-800 font-bold text-zinc-500 dark:text-zinc-400 text-sm">{timeStr}</div>
                          {weekDays.map(day => {
                            const booking = bookings.find(b => 
                              b.pitchId === pitch.id && 
                              b.startTime.getHours() === hour &&
                              isSameDay(b.startTime, day) &&
                              b.status === 'confirmed'
                            );
                            const isBooked = !!booking;
                            return (
                              <div key={day.toISOString()} className="p-2 border-r dark:border-zinc-800 flex items-center justify-center">
                                <button
                                  onClick={() => {
                                    if (isBooked) {
                                      if (user.role === 'admin') {
                                        setSelectedBooking(booking);
                                        setIsBookingDetailModalOpen(true);
                                      }
                                    } else {
                                      setSelectedDate(day);
                                      setSelectedPitch(pitch);
                                      setSelectedTime(timeStr);
                                      setIsBookingModalOpen(true);
                                    }
                                  }}
                                  className={cn(
                                    "w-full h-10 rounded-lg transition-all text-[10px] font-black uppercase",
                                    isBooked 
                                      ? (user.role === 'admin'
                                          ? "bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white"
                                          : "bg-red-50 dark:bg-red-900/10 text-red-500 cursor-not-allowed")
                                      : "bg-green-50 dark:bg-green-900/10 text-green-600 hover:bg-green-500 hover:text-white"
                                  )}
                                >
                                  {isBooked ? 'Ocupado' : 'Libre'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>

      {/* Pitch Schedule Modal (Time Selection Menu) */}
      <Modal
        isOpen={isPitchScheduleModalOpen}
        onClose={() => setIsPitchScheduleModalOpen(false)}
        title={selectedPitch ? `Agenda: ${selectedPitch.name}` : 'Seleccionar Horario'}
        className="max-w-lg"
      >
        <div className="space-y-6">
          {/* Pitch Info Header */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-zinc-900 dark:text-zinc-100">{selectedPitch?.name}</h4>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{selectedPitch?.type} • ${selectedPitch?.price}/hr</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Fecha</p>
              <p className="text-sm font-black text-green-600 dark:text-green-500">
                {format(selectedDate, "d 'de' MMM", { locale: es })}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ocupado</span>
            </div>
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {hours.map(hour => {
              const timeStr = `${hour.toString().padStart(2, '0')}:00`;
              const booking = bookings.find(b => 
                b.pitchId === selectedPitch?.id && 
                b.startTime.getHours() === hour &&
                isSameDay(b.startTime, selectedDate) &&
                b.status === 'confirmed'
              );
              const isBooked = !!booking;

              return (
                <button
                  key={hour}
                  onClick={() => {
                    if (isBooked) {
                      if (user.role === 'admin') {
                        setSelectedBooking(booking);
                        setIsBookingDetailModalOpen(true);
                      }
                    } else {
                      setSelectedTime(timeStr);
                      setIsPitchScheduleModalOpen(false);
                      setIsBookingModalOpen(true);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-5 rounded-3xl border-2 transition-all gap-1 relative overflow-hidden group/time",
                    isBooked 
                      ? (user.role === 'admin' 
                          ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white" 
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 cursor-not-allowed")
                      : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-600 dark:hover:text-green-500"
                  )}
                >
                  <span className="text-lg font-black">{timeStr}</span>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                    isBooked ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-green-100 dark:bg-green-900/30 text-green-600"
                  )}>
                    {isBooked ? 'Ocupado' : 'Libre'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <Button 
              variant="outline" 
              className="w-full py-5 rounded-3xl font-black tracking-widest uppercase border-zinc-200 dark:border-zinc-800"
              onClick={() => setIsPitchScheduleModalOpen(false)}
            >
              VOLVER AL DASHBOARD
            </Button>
          </div>
        </div>
      </Modal>

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title={`Reservar ${selectedPitch?.name}`}
      >
        <form onSubmit={handleBooking} className="space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl space-y-3 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-4 h-4 text-green-500" />
              </div>
              <span className="font-bold">{selectedTime} hs - {format(selectedDate, 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              <span className="font-bold">{selectedPitch?.type} - ${selectedPitch?.price}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Nombre del cliente</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  required
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-zinc-100"
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Teléfono de contacto</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  required
                  type="tel"
                  placeholder="Ej: 11 1234 5678"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-zinc-100"
                  value={formData.clientPhone}
                  onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Monto de la seña</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  required
                  type="number"
                  placeholder="Ej: 500"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-zinc-100"
                  value={formData.depositAmount}
                  onChange={e => setFormData({ ...formData, depositAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Comprobante de transferencia</label>
              <div 
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group",
                  formData.receipt ? "border-green-500 bg-green-500/5" : "border-zinc-200 dark:border-zinc-800 hover:border-green-500 hover:bg-green-500/5"
                )}
                onClick={() => document.getElementById('receipt-upload')?.click()}
              >
                <input 
                  id="receipt-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                
                {formData.receipt ? (
                  <>
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-black text-green-600 uppercase tracking-widest">¡Comprobante cargado!</p>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, receipt: null }));
                      }}
                      className="text-[10px] font-black text-zinc-400 hover:text-red-500 uppercase tracking-widest"
                    >
                      Cambiar imagen
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-green-500 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Haz clic para subir el comprobante</p>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">MP, Transferencia, etc.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-green-500/20">
            CONFIRMAR RESERVA
          </Button>
        </form>
      </Modal>
      {/* Booking Detail Modal */}
      <Modal
        isOpen={isBookingDetailModalOpen}
        onClose={() => setIsBookingDetailModalOpen(false)}
        title="Detalles de la Reserva"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl space-y-4 border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Cliente</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{selectedBooking.clientName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm">
                  <Phone className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Teléfono</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{selectedBooking.clientPhone}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm">
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Horario</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                    {format(selectedBooking.startTime, 'HH:mm')} hs - {format(selectedBooking.startTime, 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              {selectedBooking.depositAmount && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Seña</p>
                    <p className="text-xl font-black text-green-600 dark:text-green-500">${selectedBooking.depositAmount}</p>
                  </div>
                </div>
              )}

              {selectedBooking.receiptUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Comprobante</p>
                  <div className="relative group aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
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
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 py-4 rounded-2xl"
                onClick={() => setIsBookingDetailModalOpen(false)}
              >
                CERRAR
              </Button>
              <Button 
                variant="danger" 
                className="flex-1 py-4 rounded-2xl font-black"
                onClick={async () => {
                  try {
                    await api.cancelBooking(selectedBooking.id);
                    setBookings(dataService.getBookings());
                    setIsBookingDetailModalOpen(false);
                  } catch (error) {
                    alert('Error al cancelar la reserva');
                  }
                }}
              >
                CANCELAR TURNO
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
