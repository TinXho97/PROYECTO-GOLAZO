import React, { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
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
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { dataService, api } from '../services/dataService';
import { Booking, Pitch, User } from '../types';
import { cn } from '../lib/utils';

interface BookingsListProps {
  user: User;
  isDarkMode?: boolean;
}

export default function BookingsList({ user, isDarkMode }: BookingsListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    setPitches(dataService.getPitches());
    setBookings(dataService.getBookings());
  }, []);

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.clientPhone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesUser = user.role === 'admin' || b.userId === user.id;
    
    return matchesSearch && matchesStatus && matchesUser;
  }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  const handleCancel = async (id: string) => {
    if (window.confirm('¿Estás seguro de cancelar esta reserva?')) {
      try {
        await api.cancelBooking(id);
        setBookings(dataService.getBookings());
      } catch (error) {
        alert('Error al cancelar la reserva');
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">
            {user.role === 'admin' ? 'Gestión de Reservas' : 'Mis Reservas'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Historial y próximos turnos</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-zinc-100"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select
            className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-green-500 dark:text-zinc-100"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredBookings.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[40px] border-2 border-dashed border-zinc-100 dark:border-zinc-800"
            >
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="w-10 h-10 text-zinc-200 dark:text-zinc-700" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">No se encontraron reservas</h3>
              <p className="text-zinc-400 font-medium">Intenta cambiar los filtros o realiza una nueva reserva.</p>
            </motion.div>
          ) : (
            filteredBookings.map((booking, i) => {
              const pitch = pitches.find(p => p.id === booking.pitchId);
              const isPast = booking.startTime < new Date();
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <Card className={cn(
                    "border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden",
                    booking.status === 'cancelled' && "opacity-60"
                  )}>
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-center">
                        {/* Date Column */}
                        <div className={cn(
                          "md:w-32 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-zinc-50 dark:border-zinc-800",
                          booking.status === 'confirmed' ? "bg-green-50/30 dark:bg-green-900/10" : "bg-zinc-50/50 dark:bg-zinc-800/50"
                        )}>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                            {format(booking.startTime, 'MMM', { locale: es })}
                          </span>
                          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-none">
                            {format(booking.startTime, 'dd')}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                            {format(booking.startTime, 'yyyy')}
                          </span>
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/30 group-hover:text-green-500 transition-colors">
                                <UserIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-100">{booking.clientName}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant={booking.status === 'confirmed' ? 'success' : 'danger'}>
                                    {booking.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                                  </Badge>
                                  {isPast && booking.status === 'confirmed' && (
                                    <Badge variant="neutral">Finalizado</Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-bold text-sm">
                                <Clock className="w-4 h-4 text-green-500" />
                                {format(booking.startTime, 'HH:mm')} - {format(booking.endTime, 'HH:mm')} hs
                              </div>
                              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-bold text-sm">
                                <Phone className="w-4 h-4 text-green-500" />
                                {booking.clientPhone}
                              </div>
                              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-bold text-sm">
                                <MapPin className="w-4 h-4 text-green-500" />
                                {pitch?.name || 'Cancha eliminada'} ({pitch?.type})
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {booking.status === 'confirmed' && !isPast && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="px-6 py-3 rounded-xl border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold"
                                onClick={() => handleCancel(booking.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancelar
                              </Button>
                            )}
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
