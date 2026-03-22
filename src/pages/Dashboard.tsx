import React, { useState, useEffect } from 'react';
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
  Minimize2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { dataService, api } from '../services/dataService';
import { Pitch, Booking, User as UserType, Sale } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  user: UserType;
  isDarkMode?: boolean;
}

export default function Dashboard({ user, isDarkMode }: DashboardProps) {
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
  
  const [formData, setFormData] = useState({
    clientName: user.role === 'client' ? user.name : '',
    clientPhone: '',
  });

  useEffect(() => {
    setPitches(dataService.getPitches());
    setBookings(dataService.getBookings());
    setSales(dataService.getSales());
  }, [selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPitch || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
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
      });
      setBookings(dataService.getBookings());
      setIsBookingModalOpen(false);
      setFormData({ clientName: user.role === 'client' ? user.name : '', clientPhone: '' });
      // In a real app we'd use a toast
    } catch (error: any) {
      alert(error.message);
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

  const hours = Array.from({ length: 12 }, (_, i) => (i + 14) % 24); // 14:00 to 01:00

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6)
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Bienvenido de nuevo, {user.name}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
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
                  className={cn(
                    "rdp-custom",
                    isDarkMode ? "dark" : ""
                  )}
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
      <div className="space-y-4">
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
              <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all group bg-white dark:bg-zinc-900">
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
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Próximos turnos</p>
                          <div className={cn(
                            "grid gap-2",
                            isCompact ? "grid-cols-2" : "grid-cols-4"
                          )}>
                            {hours.slice(0, isCompact ? 4 : 8).map(hour => {
                              const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                              const isBooked = bookings.some(b => 
                                b.pitchId === pitch.id && 
                                b.startTime.getHours() === hour &&
                                isSameDay(b.startTime, selectedDate) &&
                                b.status === 'confirmed'
                              );
                              return (
                                <button
                                  key={hour}
                                  disabled={isBooked}
                                  onClick={() => {
                                    setSelectedPitch(pitch);
                                    setSelectedTime(timeStr);
                                    setIsBookingModalOpen(true);
                                  }}
                                  className={cn(
                                    "py-2 text-xs font-black rounded-xl transition-all border-2",
                                    isBooked 
                                      ? "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 cursor-not-allowed" 
                                      : "bg-white dark:bg-zinc-900 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-500 hover:bg-green-500 hover:text-white hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20"
                                  )}
                                >
                                  {timeStr}
                                </button>
                              );
                            })}
                          </div>
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
                            const isBooked = bookings.some(b => 
                              b.pitchId === pitch.id && 
                              b.startTime.getHours() === hour &&
                              isSameDay(b.startTime, day) &&
                              b.status === 'confirmed'
                            );
                            return (
                              <div key={day.toISOString()} className="p-2 border-r dark:border-zinc-800 flex items-center justify-center">
                                <button
                                  disabled={isBooked}
                                  onClick={() => {
                                    setSelectedDate(day);
                                    setSelectedPitch(pitch);
                                    setSelectedTime(timeStr);
                                    setIsBookingModalOpen(true);
                                  }}
                                  className={cn(
                                    "w-full h-10 rounded-lg transition-all text-[10px] font-black uppercase",
                                    isBooked 
                                      ? "bg-red-50 dark:bg-red-900/10 text-red-500 cursor-not-allowed" 
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
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-green-500/20">
            CONFIRMAR RESERVA
          </Button>
        </form>
      </Modal>
    </div>
  );
}
