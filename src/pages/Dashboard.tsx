import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { format, addHours, isSameDay, startOfMonth, endOfMonth, startOfWeek, addDays, eachDayOfInterval, formatDistanceToNow } from 'date-fns';
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
  CheckCircle2,
  FileText,
  Download,
  Timer,
  Zap,
  ShoppingBag,
  Package,
  Settings,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { domToPng } from 'modern-screenshot';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import ArgentinaCountdown from '../components/ArgentinaCountdown';
import { ArgentinaLogo } from '../components/ArgentinaLogo';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { dataService, api } from '../services/dataService';
import { Pitch, Booking, User as UserType, Sale, Product, Client } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  user: UserType;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  onNotificationClick?: (bookingId: string) => void;
  clientConfig?: Client | null;
}

export default function Dashboard({ user, onNavigate, onLogout, onNotificationClick, clientConfig }: DashboardProps) {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingTimer, setBookingTimer] = useState<number | null>(null);
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isPitchScheduleModalOpen, setIsPitchScheduleModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    clientName: user.role === 'client' ? (localStorage.getItem('golazo_guest_name') || '') : '',
    clientPhone: user.role === 'client' ? (localStorage.getItem('golazo_guest_phone') || '') : '',
    receipt: null as string | null,
    depositAmount: '',
    paymentMethod: 'transferencia' as 'transferencia' | 'mercadopago',
    paymentUrl: ''
  });

  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const clientId = user.client_id;
      const p = await dataService.getPitches(clientId);
      const b = await dataService.getBookings(clientId);
      const s = await dataService.getSales(clientId);
      const prods = await dataService.getProducts(clientId);
      
      const identifier = user.role === 'client' && user.phone ? user.phone : user.id;
      const points = await dataService.getUserPoints(identifier, clientId);
      
      setPitches(p);
      setBookings(b);
      setSales(s);
      setProducts(prods);
      setUserPoints(points);
    };
    fetchData();
  }, [user.id, user.phone, user.role, user.client_id]);

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

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPitch || !selectedTime) return;

    if (formData.paymentMethod === 'transferencia' && !formData.receipt) {
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
        receiptUrl: formData.receipt || undefined,
        depositAmount: Number(formData.depositAmount) || 0,
        paymentUrl: formData.paymentMethod === 'mercadopago' ? formData.paymentUrl : undefined
      });
      
      // Save client info to localStorage for future use
      if (user.role === 'client') {
        localStorage.setItem('golazo_guest_name', formData.clientName);
        localStorage.setItem('golazo_guest_phone', formData.clientPhone);
        // Dispatch custom event to update App.tsx state if needed
        window.dispatchEvent(new Event('guest_info_updated'));
      }

      const updatedBookings = await dataService.getBookings(user.client_id);
      setBookings(updatedBookings);
      const identifier = user.role === 'client' && formData.clientPhone ? formData.clientPhone : user.id;
      const updatedPoints = await dataService.getUserPoints(identifier, user.client_id);
      setUserPoints(updatedPoints);
      setIsBookingModalOpen(false);
      setFormData({ 
        clientName: user.role === 'client' ? formData.clientName : '', 
        clientPhone: user.role === 'client' ? formData.clientPhone : '', 
        receipt: null, 
        depositAmount: '',
        paymentMethod: 'transferencia',
        paymentUrl: ''
      });
      
      toast.success('¡Reserva confirmada!', {
        description: '¡Sigue jugando para sumar más puntos en el ranking!'
      });
    } catch (error: any) {
      if (error.message === 'name_mismatch') {
        toast('Este número ya está registrado con otro nombre, pero la reserva se ha creado.', {
          icon: '⚠️',
        });
        
        // Save to localStorage
        if (user.role === 'client') {
          localStorage.setItem('golazo_guest_name', formData.clientName);
          localStorage.setItem('golazo_guest_phone', formData.clientPhone);
          window.dispatchEvent(new Event('guest_info_updated'));
        }

        const updatedBookings = await dataService.getBookings(user.client_id);
        setBookings(updatedBookings);
        const identifier = user.role === 'client' && formData.clientPhone ? formData.clientPhone : user.id;
        const updatedPoints = await dataService.getUserPoints(identifier, user.client_id);
        setUserPoints(updatedPoints);
        setIsBookingModalOpen(false);
        setFormData({ 
          clientName: user.role === 'client' ? formData.clientName : '', 
          clientPhone: user.role === 'client' ? formData.clientPhone : '', 
          receipt: null, 
          depositAmount: '',
          paymentMethod: 'transferencia',
          paymentUrl: ''
        });
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB for localStorage safety)
      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo es muy pesado (máximo 2MB). Por favor, sube una imagen más pequeña o un PDF liviano.');
        return;
      }

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

      const text = encodeURIComponent(`⚽ *Disponibilidad Golazo - ${format(selectedDate, 'dd/MM/yyyy')}*\n\n${availableSlots}\n\n¡Reserva tu turno ahora!`);
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

  const todaySales = sales.filter(s => isSameDay(new Date(s.date), new Date()));
  const todaySalesIncome = todaySales.reduce((acc, s) => acc + s.totalPrice, 0);
  const todayTotalIncome = todayIncome + todaySalesIncome;

  const hours = Array.from({ length: 12 }, (_, i) => (i + 14) % 24); // 14:00 to 01:00 (starts at 00:00)
  const occupancyPercentage = pitches.length > 0 ? Math.round((todayBookings.length / (hours.length * pitches.length)) * 100) : 0;

  let generalStatus = { text: 'Normal', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (occupancyPercentage >= 80) {
    generalStatus = { text: 'Saturado', color: 'bg-red-100 text-red-700 border-red-200' };
  } else if (occupancyPercentage >= 50) {
    generalStatus = { text: 'Alta Demanda', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  }

  const nextBooking = bookings
    .filter(b => b.startTime > new Date() && b.status === 'confirmed')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

  const lastSale = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const [weather, setWeather] = useState<{ temp: number; condition: string; icon: string; locationName: string }>({
    temp: 22,
    condition: 'Cargando...',
    icon: '⏳',
    locationName: 'Tu ubicación'
  });

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        let city = 'Tu ubicación';
        try {
          // Fetch location name with a timeout or just handle failure
          const locResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: {
              'Accept-Language': 'es'
            }
          });
          if (locResponse.ok) {
            const locData = await locResponse.json();
            city = locData.address.city || locData.address.town || locData.address.village || 'Tu ubicación';
          }
        } catch (locError) {
          console.warn('Error fetching location name:', locError);
        }

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (!response.ok) throw new Error(`Weather API responded with status: ${response.status}`);
        
        const data = await response.json();
        const current = data.current_weather;
        
        if (!current) throw new Error('No current weather data available');

        // Map WMO Weather interpretation codes (WW)
        const getCondition = (code: number) => {
          if (code === 0) return { text: 'Despejado', icon: '☀️' };
          if (code <= 3) return { text: 'Parcialmente Nublado', icon: '🌤️' };
          if (code <= 48) return { text: 'Niebla', icon: '🌫️' };
          if (code <= 55) return { text: 'Llovizna', icon: '🌦️' };
          if (code <= 65) return { text: 'Lluvia', icon: '🌧️' };
          if (code <= 75) return { text: 'Nieve', icon: '❄️' };
          if (code <= 82) return { text: 'Chubascos', icon: '🌦️' };
          if (code <= 99) return { text: 'Tormenta', icon: '⛈️' };
          return { text: 'Soleado', icon: '☀️' };
        };

        const { text, icon } = getCondition(current.weathercode);
        setWeather({
          temp: Math.round(current.temperature),
          condition: text,
          icon: icon,
          locationName: city
        });
      } catch (error) {
        // Fallback to a default state instead of logging an error
        setWeather({ 
          temp: 22, 
          condition: 'Soleado', 
          icon: '☀️', 
          locationName: 'Buenos Aires' 
        });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to Buenos Aires
          fetchWeather(-34.6037, -58.3816);
        }
      );
    } else {
      // Fallback to Buenos Aires
      fetchWeather(-34.6037, -58.3816);
    }
  }, []);

  if (user.role === 'client') {
    return (
      <div className="space-y-8 pb-20 max-w-4xl mx-auto">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="md:hidden">
                  <ArgentinaLogo size="sm" showText={true} />
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 tracking-tighter uppercase italic">INICIO</h1>
              </div>
              <div className="flex flex-col">
                <p className="text-zinc-500 font-bold text-lg italic">¡Hola, {user.name}! 👋</p>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">Panel de Jugador</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button 
              onClick={() => onNavigate && onNavigate('calendar')}
              className="w-full text-left bg-gradient-to-br from-sky-500 to-blue-600 p-6 rounded-[24px] shadow-lg shadow-sky-500/20 hover:scale-[1.02] transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CalendarIcon className="w-8 h-8 text-white mb-4" />
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Reservar Cancha</h3>
              <p className="text-sky-100 text-xs font-bold mt-1">Ver horarios disponibles</p>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button 
              onClick={() => onNavigate && onNavigate('bookings')}
              className="w-full text-left bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100 hover:border-sky-200 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <List className="w-8 h-8 text-sky-500 mb-4" />
              <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase italic">Mis Reservas</h3>
              <p className="text-zinc-500 text-xs font-bold mt-1">Ver historial y próximas</p>
            </button>
          </motion.div>

          {(!clientConfig || clientConfig.features?.ranking !== false) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <button 
                onClick={() => onNavigate && onNavigate('ranking')}
                className="w-full text-left bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100 hover:border-yellow-200 hover:shadow-md transition-all group relative overflow-hidden"
              >
                <Trophy className="w-8 h-8 text-yellow-500 mb-4" />
                <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase italic">Ranking</h3>
                <p className="text-zinc-500 text-xs font-bold mt-1">Mis puntos: {userPoints}</p>
              </button>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <button 
              onClick={() => onLogout && onLogout()}
              className="w-full text-left bg-red-50 p-6 rounded-[24px] shadow-sm border border-red-100 hover:bg-red-100 transition-all group relative overflow-hidden"
            >
              <User className="w-8 h-8 text-red-500 mb-4" />
              <h3 className="text-2xl font-black text-red-700 tracking-tighter uppercase italic">Cerrar Sesión</h3>
              <p className="text-red-500/80 text-xs font-bold mt-1">Salir de la cuenta</p>
            </button>
          </motion.div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      {/* 1. HEADER INTELIGENTE */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-zinc-100">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tighter uppercase italic">Resumen del día</h1>
            <Badge variant="neutral" className={cn("px-3 py-1 rounded-xl font-black text-xs uppercase tracking-widest border", generalStatus.color)}>
              {generalStatus.text}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 font-medium">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-lg capitalize">{format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block mr-4">
            <NotificationsPanel onNotificationClick={async (bookingId) => {
              if (onNotificationClick) {
                onNotificationClick(bookingId);
              } else {
                let booking = bookings.find(b => b.id === bookingId);
                if (!booking) {
                  const latestBookings = await dataService.getBookings(user.client_id);
                  setBookings(latestBookings);
                  booking = latestBookings.find(b => b.id === bookingId);
                }
                if (booking) {
                  setSelectedBooking(booking);
                  setIsBookingDetailModalOpen(true);
                } else {
                  toast.error('No se pudo encontrar la reserva');
                }
              }
            }} />
          </div>
          {(!clientConfig || clientConfig.features?.reservas !== false) && (
            <Button 
              onClick={() => onNavigate && onNavigate('calendar')}
              className="rounded-2xl py-6 px-6 font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nueva Reserva
            </Button>
          )}
          {(!clientConfig || clientConfig.features?.ventas !== false) && (
            <Button 
              variant="outline"
              onClick={() => onNavigate && onNavigate('sales')}
              className="rounded-2xl py-6 px-6 font-black uppercase tracking-widest text-xs border-zinc-200 hover:bg-zinc-50 hover:scale-105 transition-transform"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Nueva Venta
            </Button>
          )}
        </div>
      </header>

      {/* 2. MÉTRICAS CLAVE */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          (!clientConfig || clientConfig.features?.reservas !== false) && { label: 'Turnos del día', value: todayBookings.length, icon: CalendarIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
          (!clientConfig || clientConfig.features?.ventas !== false) && { label: 'Ingresos del día', value: `$${todayTotalIncome}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          (!clientConfig || clientConfig.features?.ventas !== false) && { label: 'Ventas del día', value: todaySales.length, icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50' },
          (!clientConfig || clientConfig.features?.reservas !== false) && { label: 'Ocupación', value: `${occupancyPercentage}%`, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
        ].filter(Boolean).map((stat: any, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm bg-white rounded-[32px] p-8 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest mb-2">{stat.label}</p>
                  <h3 className="text-5xl font-black text-zinc-900 tracking-tighter italic">{stat.value}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. ZONA OPERATIVA */}
        <section className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase italic flex items-center gap-3 px-2">
            <Zap className="w-6 h-6 text-sky-500" />
            Próximas Acciones
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Próxima Reserva */}
            {(!clientConfig || clientConfig.features?.reservas !== false) && (
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100 flex items-center justify-between group hover:border-sky-200 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Próxima Reserva</p>
                    {nextBooking ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-zinc-900">{format(nextBooking.startTime, 'HH:mm')}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="font-medium text-zinc-600">{pitches.find(p => p.id === nextBooking.pitchId)?.name}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="font-medium text-zinc-600">{nextBooking.clientName}</span>
                      </div>
                    ) : (
                      <p className="text-lg font-medium text-zinc-500">No hay reservas próximas</p>
                    )}
                  </div>
                </div>
                {nextBooking && (
                  <Button variant="ghost" className="rounded-xl" onClick={() => {
                    setSelectedBooking(nextBooking);
                    setIsBookingDetailModalOpen(true);
                  }}>
                    Ver detalle
                  </Button>
                )}
              </div>
            )}

            {/* Stock Bajo */}
            {(!clientConfig || clientConfig.features?.ventas !== false) && (
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100 flex items-center justify-between group hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Alertas de Stock</p>
                    {lowStockProducts.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-orange-600">{lowStockProducts.length} productos</span>
                        <span className="font-medium text-zinc-600">por debajo del mínimo</span>
                      </div>
                    ) : (
                      <p className="text-lg font-medium text-zinc-500">Stock en niveles normales</p>
                    )}
                  </div>
                </div>
                {lowStockProducts.length > 0 && (
                  <Button variant="ghost" className="rounded-xl text-orange-600 hover:text-orange-700 hover:bg-orange-50" onClick={() => onNavigate && onNavigate('admin')}>
                    Reponer
                  </Button>
                )}
              </div>
            )}

            {/* Última Venta */}
            {(!clientConfig || clientConfig.features?.ventas !== false) && (
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-zinc-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Última Venta</p>
                    {lastSale ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-emerald-600">${lastSale.totalPrice}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="font-medium text-zinc-600">{formatDistanceToNow(new Date(lastSale.date), { addSuffix: true, locale: es })}</span>
                      </div>
                    ) : (
                      <p className="text-lg font-medium text-zinc-500">No hay ventas recientes</p>
                    )}
                  </div>
                </div>
                {lastSale && (
                  <Button variant="ghost" className="rounded-xl" onClick={() => onNavigate && onNavigate('sales')}>
                    Ver ventas
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 4. SECCIÓN SECUNDARIA */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase italic flex items-center gap-3 px-2">
            <LayoutGrid className="w-6 h-6 text-sky-500" />
            Accesos Rápidos
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {(!clientConfig || clientConfig.features?.reservas !== false) && (
              <button 
                onClick={() => onNavigate && onNavigate('calendar')}
                className="w-full flex items-center gap-4 p-5 bg-white rounded-[24px] border border-zinc-100 hover:border-sky-200 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-zinc-900">Ir a Reservas</h3>
                  <p className="text-xs text-zinc-500">Gestionar turnos de canchas</p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 ml-auto group-hover:text-sky-500 transition-colors" />
              </button>
            )}

            {(!clientConfig || clientConfig.features?.ventas !== false) && (
              <button 
                onClick={() => onNavigate && onNavigate('sales')}
                className="w-full flex items-center gap-4 p-5 bg-white rounded-[24px] border border-zinc-100 hover:border-purple-200 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-zinc-900">Ir a Ventas</h3>
                  <p className="text-xs text-zinc-500">Kiosco y productos</p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 ml-auto group-hover:text-purple-500 transition-colors" />
              </button>
            )}

            <button 
              onClick={() => onNavigate && onNavigate('admin')}
              className="w-full flex items-center gap-4 p-5 bg-white rounded-[24px] border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-zinc-900">Configuración</h3>
                <p className="text-xs text-zinc-500">Ajustes del sistema</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 ml-auto group-hover:text-zinc-900 transition-colors" />
            </button>
          </div>
        </section>
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
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-zinc-900">{selectedPitch?.name}</h4>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{selectedPitch?.type} • ${selectedPitch?.price}/hr</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Fecha</p>
              <p className="text-sm font-black text-sky-600">
                {format(selectedDate, "d 'de' MMM", { locale: es })}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sky-500" />
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
                      setBookingTimer(300); // 5 minutes
                      setIsBookingModalOpen(true);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-5 rounded-3xl border-2 transition-all gap-1 relative overflow-hidden group/time",
                    isBooked 
                      ? (user.role === 'admin' 
                          ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-500 hover:text-white" 
                          : "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed")
                      : "bg-white border-zinc-100 text-zinc-900 hover:border-sky-500 hover:bg-sky-50 hover:text-sky-600"
                  )}
                >
                  <span className="text-lg font-black">{timeStr}</span>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                    isBooked ? "bg-red-100 text-red-600" : "bg-sky-100 text-sky-600"
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
              className="w-full py-5 rounded-3xl font-black tracking-widest uppercase border-zinc-200"
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
        {bookingTimer !== null && (
          <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-2xl border border-red-100 mb-6 animate-pulse">
            <Timer className="w-5 h-5" />
            <span className="font-black tracking-widest uppercase text-xs">
              Tiempo restante: {Math.floor(bookingTimer / 60)}:{(bookingTimer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
        <form onSubmit={handleBooking} className="space-y-6">
          <div className="bg-zinc-50 p-6 rounded-3xl space-y-3 border border-zinc-100">
            <div className="flex items-center gap-3 text-zinc-600">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-4 h-4 text-sky-500" />
              </div>
              <span className="font-bold">{selectedTime} hs - {format(selectedDate, 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-600">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <MapPin className="w-4 h-4 text-sky-500" />
              </div>
              <span className="font-bold">{selectedPitch?.type} - ${selectedPitch?.price}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 ml-1">Nombre del cliente</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  required
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900"
                  value={formData.clientName}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^[a-zA-Z\s]*$/.test(val)) {
                      setFormData({ ...formData, clientName: val });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 ml-1">Teléfono de contacto</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  required
                  type="tel"
                  placeholder="Ej: 1112345678"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900"
                  value={formData.clientPhone}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^[0-9]*$/.test(val)) {
                      setFormData({ ...formData, clientPhone: val });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 ml-1">Monto de la seña</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  required
                  type="text"
                  placeholder="Ej: 500.50"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-zinc-900"
                  value={formData.depositAmount}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) {
                      setFormData({ ...formData, depositAmount: val });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 ml-1">Método de pago de seña</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'transferencia' })}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                    formData.paymentMethod === 'transferencia' 
                      ? "bg-sky-50 text-sky-600 border-sky-200" 
                      : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'mercadopago' })}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                    formData.paymentMethod === 'mercadopago' 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                      : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  Efectivo
                </button>
              </div>
            </div>

            {formData.paymentMethod === 'transferencia' ? (
              <div className="space-y-4">
                <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 space-y-2">
                  <p className="text-sm font-bold text-sky-800">Datos Bancarios</p>
                  <div className="text-xs text-sky-700 space-y-1">
                    <p><span className="font-semibold">Banco:</span> Banco Nación</p>
                    <p><span className="font-semibold">Titular:</span> Complejo Golazo</p>
                    <p><span className="font-semibold">CBU:</span> 1234567890123456789012</p>
                    <p><span className="font-semibold">Alias:</span> GOLAZO.CANCHA</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 ml-1">Comprobante de transferencia</label>
                  <div 
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group",
                      formData.receipt ? "border-sky-500 bg-sky-500/5" : "border-zinc-200 hover:border-sky-500 hover:bg-sky-500/5"
                    )}
                    onClick={() => document.getElementById('receipt-upload')?.click()}
                  >
                    <input 
                      id="receipt-upload"
                      type="file" 
                      accept="image/*,application/pdf" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    
                    {formData.receipt ? (
                      <>
                        <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-black text-sky-600 uppercase tracking-widest">¡Comprobante cargado!</p>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, receipt: null }));
                          }}
                          className="text-[9px] font-black text-zinc-400 hover:text-red-500 uppercase tracking-widest"
                        >
                          Cambiar imagen
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-sky-500 transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-zinc-600">Haz clic para subir el comprobante</p>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">MP, Transferencia, etc.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Banknote className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-emerald-800">
                  El pago se realiza en la cancha antes del turno
                </p>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-sky-500/20">
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
            <div className="bg-zinc-50 p-6 rounded-3xl space-y-4 border border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Cliente</p>
                  <p className="text-xl font-black text-zinc-900">{selectedBooking.clientName}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Phone className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Teléfono</p>
                    <p className="text-xl font-black text-zinc-900">{selectedBooking.clientPhone}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 rounded-xl px-3"
                  onClick={() => window.open(`https://wa.me/${selectedBooking.clientPhone.replace(/\D/g, '')}`, '_blank')}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Clock className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Horario</p>
                  <p className="text-xl font-black text-zinc-900">
                    {format(selectedBooking.startTime, 'HH:mm')} hs - {format(selectedBooking.startTime, 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              {selectedBooking.depositAmount && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <DollarSign className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Seña</p>
                    <p className="text-xl font-black text-sky-600">${selectedBooking.depositAmount}</p>
                  </div>
                </div>
              )}

              {selectedBooking.paymentUrl && (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Referencia Mercado Pago</p>
                    <p className="text-xl font-black text-zinc-900">{selectedBooking.paymentUrl}</p>
                  </div>
                </div>
              )}

              {selectedBooking.receiptUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Comprobante</p>
                  <div className="relative group aspect-video rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                    {selectedBooking.receiptUrl.startsWith('data:application/pdf') ? (
                      <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">Archivo PDF</p>
                          <p className="text-xs text-zinc-500">Haz clic para abrir el documento</p>
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
                            onClick={() => setSelectedReceipt(selectedBooking.receiptUrl!)}
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
                    await api.cancelBooking(selectedBooking.id, user.client_id);
                    const updatedBookings = await dataService.getBookings(user.client_id);
                    setBookings(updatedBookings);
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
