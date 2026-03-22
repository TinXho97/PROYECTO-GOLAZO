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
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
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

  useEffect(() => {
    setPitches(dataService.getPitches());
    setBookings(dataService.getBookings());
  }, []);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 14) % 24); // 14:00 to 01:00
  
  const days = view === 'day' 
    ? [selectedDate] 
    : eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      });

  const filteredPitches = filterPitch === 'all' 
    ? pitches 
    : pitches.filter(p => p.id === filterPitch);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">Calendario</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Vista detallada de ocupación</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <button
              onClick={() => setView('day')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === 'day' ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              Día
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === 'week' ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              Semana
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
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(d => addDays(d, view === 'day' ? -1 : -7))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <button 
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="px-4 font-bold text-zinc-700 dark:text-zinc-300 min-w-[140px] text-center hover:bg-zinc-50 dark:hover:bg-zinc-800 py-1 rounded-xl transition-colors"
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

          <select
            className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-green-500 dark:text-zinc-100"
            value={filterPitch}
            onChange={e => setFilterPitch(e.target.value)}
          >
            <option value="all">Todas las canchas</option>
            {pitches.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </header>

      <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-white dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(150px,1fr))] border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="p-4 border-r border-zinc-100 dark:border-zinc-800" />
              {days.map(day => (
                <div key={day.toString()} className="p-4 text-center border-r border-zinc-100 dark:border-zinc-800 last:border-r-0">
                  <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400 dark:text-zinc-500 mb-1">
                    {format(day, 'EEEE', { locale: es })}
                  </p>
                  <p className={cn(
                    "text-xl font-black",
                    isSameDay(day, new Date()) ? "text-green-600" : "text-zinc-900 dark:text-zinc-100"
                  )}>
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            {hours.map(hour => (
              <div key={hour} className={cn(
                "grid grid-cols-[100px_repeat(auto-fit,minmax(150px,1fr))] border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 group",
                isCompact ? "min-h-[60px]" : "min-h-[100px]"
              )}>
                <div className="p-4 border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/10 flex items-center justify-center">
                  <span className="text-sm font-black text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
                {days.map(day => (
                  <div key={day.toString()} className="p-2 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 relative bg-white dark:bg-zinc-900">
                    <div className="space-y-1">
                      {filteredPitches.map(pitch => {
                        const booking = bookings.find(b => 
                          b.pitchId === pitch.id && 
                          b.startTime.getHours() === hour &&
                          isSameDay(b.startTime, day) &&
                          b.status === 'confirmed'
                        );

                        if (!booking) return null;

                        const isOwnBooking = booking.userId === user.id;
                        const canSeeDetails = user.role === 'admin' || isOwnBooking;

                        return (
                          <motion.button
                            key={booking.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => {
                              if (canSeeDetails) {
                                setSelectedBooking(booking);
                              }
                            }}
                            className={cn(
                              "w-full p-2 rounded-xl text-left transition-all relative overflow-hidden group/item",
                              canSeeDetails ? "hover:shadow-lg hover:scale-[1.02] cursor-pointer" : "cursor-default",
                              pitch.id === 'p1' ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800" :
                              pitch.id === 'p2' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800" :
                              "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-800"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                                {pitch.name}
                              </span>
                              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            </div>
                            <p className={cn("font-black truncate", isCompact ? "text-[10px]" : "text-xs")}>
                              {canSeeDetails ? booking.clientName : 'Ocupado'}
                            </p>
                          </motion.button>
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

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Detalles de la Reserva"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-6 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-100 dark:border-green-800">
              <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm">
                <Trophy className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{selectedBooking.clientName}</h3>
                <Badge variant="success">Reserva Confirmada</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Horario
                </p>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  {format(selectedBooking.startTime, 'HH:mm')} - {format(selectedBooking.endTime, 'HH:mm')} hs
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> Fecha
                </p>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  {format(selectedBooking.startTime, "d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </p>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedBooking.clientPhone}</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Cancha
                </p>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  {pitches.find(p => p.id === selectedBooking.pitchId)?.name}
                </p>
              </div>
              {selectedBooking.depositAmount && (
                <div className="p-4 bg-green-500/5 dark:bg-green-500/10 rounded-2xl space-y-1 border border-green-500/20">
                  <p className="text-[10px] font-black text-green-600 dark:text-green-500 uppercase tracking-widest flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Seña
                  </p>
                  <p className="font-black text-green-600 dark:text-green-500 text-lg">
                    ${selectedBooking.depositAmount}
                  </p>
                </div>
              )}
            </div>

            {selectedBooking.receiptUrl && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Comprobante de Pago</p>
                <div className="relative group aspect-video rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
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

            {user.role === 'admin' && (
              <div className="pt-4 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 py-4 border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={async () => {
                    await api.cancelBooking(selectedBooking.id);
                    setBookings(dataService.getBookings());
                    setSelectedBooking(null);
                  }}
                >
                  Cancelar Reserva
                </Button>
                <Button className="flex-1 py-4">Editar Datos</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
