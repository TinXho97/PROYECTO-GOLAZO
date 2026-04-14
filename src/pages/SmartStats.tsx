import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Clock, 
  Activity, 
  Target, 
  Zap, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  LayoutGrid,
  ChevronRight,
  Info
} from 'lucide-react';
import { analyticsService, AnalyticsData } from '../services/analyticsService';
import { dataService } from '../services/dataService';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const SmartStats: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    dataService.getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const analytics = await analyticsService.getAnalytics(days, user?.client_id);
        setData(analytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days, user]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Calculando Estadísticas Inteligentes...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const chartData = Object.entries(data.bookingsByDay).map(([day, count]) => ({
    name: day.split('-').slice(2).join('/'),
    reservas: count,
    ingresos: data.incomeByDay[day] || 0
  }));

  const dayOfWeekData = Object.entries(data.bookingsByDayOfWeek).map(([day, count]) => ({
    name: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][parseInt(day)],
    count
  }));

  const pitchData = Object.entries(data.incomeByPitch).map(([id, income]) => ({
    name: `Cancha ${id.replace('p', '')}`,
    income: income as number
  }));

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Live Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-zinc-900 uppercase italic leading-none">
            Estadísticas <span className="text-sky-500">Inteligentes</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-2 max-w-md">
            Análisis profundo de rendimiento, demanda y proyecciones basado en datos reales del sistema.
          </p>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-2xl border border-zinc-200 shadow-sm">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                days === d 
                  ? 'bg-white text-zinc-900 shadow-lg' 
                  : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {d} Días
            </button>
          ))}
        </div>
      </div>

      {/* 1. Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Ingresos Totales" 
          value={formatCurrency(data.totalIncome)} 
          icon={<DollarSign className="w-5 h-5" />}
          subtitle={`Promedio: ${formatCurrency(data.averageIncomePerDay)}/día`}
          color="emerald"
        />
        <MetricCard 
          title="Ocupación Real" 
          value={`${data.occupancyRate.toFixed(1)}%`} 
          icon={<Activity className="w-5 h-5" />}
          subtitle="Capacidad utilizada"
          color="sky"
        />
        <MetricCard 
          title="Ingreso x Turno" 
          value={formatCurrency(data.averageIncomePerBooking)} 
          icon={<Target className="w-5 h-5" />}
          subtitle="Ticket promedio"
          color="indigo"
        />
        <MetricCard 
          title="Cancha Estrella" 
          value={pitchData.sort((a, b) => b.income - a.income)[0]?.name || "N/A"} 
          icon={<Zap className="w-5 h-5" />}
          subtitle="Mayor rentabilidad"
          color="amber"
        />
      </div>

      {/* 2. Análisis de Ocupación & Ingresos (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-zinc-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-zinc-900 uppercase italic tracking-tight">Tendencia de Ingresos</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Evolución diaria del periodo</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-zinc-400 uppercase">Ingresos</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val: number) => `$${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: '1px solid #e4e4e7', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <TrendingUp className="w-48 h-48" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">Proyección Mensual</h3>
            </div>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-8">
              Basado en el ritmo actual de los últimos {days} días, el sistema estima un cierre de mes optimizado.
            </p>
            <div className="space-y-2">
              <span className="text-5xl font-black tracking-tighter block">
                {formatCurrency(data.projections.monthly)}
              </span>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1",
                  data.projections.trend === 'up' ? "bg-emerald-500/20 text-emerald-400" : 
                  data.projections.trend === 'down' ? "bg-red-500/20 text-red-400" : "bg-zinc-500/20 text-zinc-400"
                )}>
                  {data.projections.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : 
                   data.projections.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                  Tendencia {data.projections.trend === 'up' ? 'Alcista' : data.projections.trend === 'down' ? 'Bajista' : 'Estable'}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
              <span>Día más fuerte</span>
              <span className="text-white">{data.strongestDay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Análisis de Demanda & Eficiencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupación por Día de la Semana */}
        <div className="bg-white rounded-[40px] border border-zinc-200 p-8 shadow-sm">
          <h3 className="text-xl font-black text-zinc-900 uppercase italic tracking-tight mb-8 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-zinc-400" />
            Ocupación por Día
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]}>
                  {dayOfWeekData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count === Math.max(...dayOfWeekData.map(d => d.count as number)) ? '#0ea5e9' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Análisis de Eficiencia */}
        <div className="bg-white rounded-[40px] border border-zinc-200 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-zinc-900 uppercase italic tracking-tight mb-8 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-zinc-400" />
              Análisis de Eficiencia
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Turnos Vacíos</p>
                  <p className="text-3xl font-black text-zinc-900">{(100 - data.occupancyRate).toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Ingresos Perdidos (Est.)</p>
                  <p className="text-xl font-black text-red-500">{formatCurrency(data.lostIncomeEstimation)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Horarios Críticos</p>
                <div className="flex flex-wrap gap-2">
                  {data.lowDemandHours.map(h => (
                    <div key={h} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {h}:00 hs
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
              Dato: El día {data.weakestDay} presenta la menor actividad. Considerar promociones "Full Day" para este día.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Resumen General */}
      <div className="bg-white rounded-[40px] p-8 border border-zinc-200 shadow-sm">
        <h2 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tight mb-8 flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-sky-500" />
          1. Resumen General
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Estado del Negocio */}
          <div className="space-y-6">
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-zinc-400" />
              Estado del Negocio
            </h3>
            <div className="p-8 bg-zinc-50 rounded-[32px] border border-zinc-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BarChart3 className="w-24 h-24" />
              </div>
              <p className="text-zinc-600 font-medium leading-relaxed relative z-10">
                Durante los últimos <span className="text-zinc-900 font-black">{days} días</span>, el sistema ha procesado un total de <span className="text-zinc-900 font-black">{data.totalBookings} reservas</span>, generando un ingreso total de <span className="text-emerald-600 font-black">{formatCurrency(data.totalIncome)}</span>. La ocupación promedio se mantiene en un <span className="text-sky-600 font-black">{data.occupancyRate.toFixed(1)}%</span>.
              </p>
            </div>
          </div>

          {/* Rendimiento por Cancha */}
          <div className="space-y-6">
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
              <PieChart className="w-5 h-5 text-zinc-400" />
              Rendimiento por Cancha
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {pitchData.map((pitch, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:border-zinc-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-400 text-xs">
                      0{idx + 1}
                    </div>
                    <span className="font-bold text-zinc-900">{pitch.name}</span>
                  </div>
                  <span className="font-black text-zinc-900">{formatCurrency(pitch.income)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle: string;
  color: 'emerald' | 'sky' | 'indigo' | 'amber';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, subtitle, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-3 rounded-2xl border", colors[color])}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-zinc-900 tracking-tighter mb-1">{value}</h3>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{subtitle}</p>
      </div>
    </motion.div>
  );
};

export default SmartStats;
