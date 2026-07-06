import React, { useState, useEffect } from 'react';
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
import { Skeleton } from '../components/ui/SkeletonLoader';
import { AdminPageHeader } from '../components/admin/AdminPageHeader';
import { AdminMetricCard } from '../components/admin/AdminMetricCard';

const SmartStats: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    dataService.getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const analytics = await analyticsService.getAnalytics(days, user?.client_id);
        if (!ignore) setData(analytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();
    return () => { ignore = true; };
  }, [days, user?.client_id]);

  if (loading || !data) {
    return (
      <div className="space-y-5 pb-20">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-12 w-96 mb-3" />
            <Skeleton className="h-5 w-full max-w-md" />
          </div>
          <Skeleton className="h-12 w-56 rounded-2xl" />
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-44 rounded-[24px]" />
          <Skeleton className="h-44 rounded-[24px]" />
          <Skeleton className="h-44 rounded-[24px]" />
          <Skeleton className="h-44 rounded-[24px]" />
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-[24px]" />
          <Skeleton className="h-[400px] rounded-[24px]" />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const totalIncome = data.totalIncome || 0;
  const averageIncomePerDay = data.averageIncomePerDay || 0;
  const averageIncomePerBooking = data.averageIncomePerBooking || 0;
  const occupancyRate = data.occupancyRate || 0;
  const totalBookings = data.totalBookings || 0;
  const lostIncomeEstimation = data.lostIncomeEstimation || 0;
  const strongestDay = data.strongestDay || 'N/A';
  const weakestDay = data.weakestDay || 'N/A';
  const lowDemandHours = data.lowDemandHours || [];
  const projections = data.projections || { monthly: 0, trend: 'stable' };

  const chartData = Object.entries(data.bookingsByDay || {}).map(([day, count]) => ({
    name: day.split('-').slice(2).join('/'),
    reservas: count,
    ingresos: (data.incomeByDay || {})[day] || 0
  }));

  const dayOfWeekData = Object.entries(data.bookingsByDayOfWeek || {}).map(([day, count]) => ({
    name: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][parseInt(day)],
    count
  }));

  const pitchData = Object.entries(data.incomeByPitch || {}).map(([id, income]) => ({
    name: `Cancha ${id.replace('p', '')}`,
    income: income as number
  }));

  const hasChartData = chartData.some(d => d.reservas > 0 || d.ingresos > 0);
  const hasDayOfWeekData = dayOfWeekData.some(d => (d.count as number) > 0);

  return (
    <div className="space-y-5 pb-20">
      <AdminPageHeader
        title={<>Estadísticas <span className="text-[#0EA5E9]">Inteligentes</span></>}
        meta="Live intelligence"
        icon={<BarChart3 className="h-6 w-6" />}
        subtitle="Análisis de rendimiento, demanda y proyecciones basado en datos reales del sistema."
        actions={
          <div className="flex rounded-2xl border border-slate-200 bg-[#F6F8FB] p-1 shadow-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={cn(
                  'rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/30',
                  days === d
                    ? 'bg-white text-[#0F2747] shadow-[0_8px_18px_rgba(8,26,51,0.08)]'
                    : 'text-[#64748B] hover:text-[#0F2747]'
                )}
              >
                {d} días
              </button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Ingresos totales"
          value={formatCurrency(totalIncome)}
          icon={DollarSign}
          tone="green"
          helperText={`Promedio: ${formatCurrency(averageIncomePerDay)}/día`}
        />
        <AdminMetricCard
          label="Ocupación real"
          value={`${occupancyRate.toFixed(1)}%`}
          icon={Activity}
          tone="blue"
          helperText="Capacidad utilizada"
        />
        <AdminMetricCard
          label="Ingreso x turno"
          value={formatCurrency(averageIncomePerBooking)}
          icon={Target}
          tone="neutral"
          helperText="Ticket promedio"
        />
        <AdminMetricCard
          label="Cancha estrella"
          value={pitchData.sort((a, b) => b.income - a.income)[0]?.name || 'N/A'}
          icon={Zap}
          tone="gold"
          helperText="Mayor rentabilidad"
        />
      </div>
      {/* 2. Análisis de Ocupación & Ingresos (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[22px] border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-zinc-900  tracking-tight">Tendencia de Ingresos</h3>
              <p className="text-xs font-bold text-zinc-400 ">Evolución diaria del periodo</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase">Ingresos</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {hasChartData ? (
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
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
                <BarChart3 className="w-8 h-8 opacity-20" />
                <span className="text-xs font-bold  text-center px-4">Sin datos registrados para este período</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-[24px] p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <TrendingUp className="w-48 h-48" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="text-xl font-extrabold  tracking-tight">Proyección Mensual</h3>
            </div>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-8">
              Basado en el ritmo actual de los últimos {days} días, el sistema estima un cierre de mes optimizado.
            </p>
            <div className="space-y-2">
              <span className="text-4xl font-extrabold tracking-tighter block">
                {formatCurrency(projections.monthly)}
              </span>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-extrabold  flex items-center gap-1",
                  projections.trend === 'up' ? "bg-emerald-500/20 text-emerald-400" : 
                  projections.trend === 'down' ? "bg-red-500/20 text-red-400" : "bg-zinc-500/20 text-zinc-400"
                )}>
                  {projections.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : 
                   projections.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                  Tendencia {projections.trend === 'up' ? 'Alcista' : projections.trend === 'down' ? 'Bajista' : 'Estable'}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-bold  text-zinc-500">
              <span>Día más fuerte</span>
              <span className="text-white">{strongestDay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Análisis de Demanda & Eficiencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupación por Día de la Semana */}
        <div className="bg-white rounded-[22px] border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xl font-extrabold text-zinc-900  tracking-tight mb-8 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-zinc-400" />
            Ocupación por Día
          </h3>
          <div className="h-[250px] w-full">
            {hasDayOfWeekData ? (
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
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
                <BarChart3 className="w-8 h-8 opacity-20" />
                <span className="text-xs font-bold  text-center px-4">Sin datos registrados para este período</span>
              </div>
            )}
          </div>
        </div>

        {/* Análisis de Eficiencia */}
        <div className="bg-white rounded-[22px] border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-zinc-900  tracking-tight mb-8 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-zinc-400" />
              Análisis de Eficiencia
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <div>
                  <p className="text-[10px] font-extrabold text-zinc-400  mb-1">Turnos Vacíos</p>
                  <p className="text-2xl font-extrabold text-zinc-900">{(100 - occupancyRate).toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-extrabold text-zinc-400  mb-1">Ingresos Perdidos (Est.)</p>
                  <p className="text-xl font-extrabold text-red-500">{formatCurrency(lostIncomeEstimation)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-xs font-bold text-zinc-500 ">Horarios Críticos</p>
                <div className="flex flex-wrap gap-2">
                  {lowDemandHours.map(h => (
                    <div key={h} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {h}:00 hs
                    </div>
                  ))}
                  {lowDemandHours.length === 0 && <span className="text-xs text-zinc-400 italic">No hay datos</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
              Dato: El día {weakestDay} presenta la menor actividad. Considerar promociones "Full Day" para este día.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Resumen General */}
      <div className="bg-white rounded-[22px] p-6 border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-extrabold text-zinc-900  tracking-tight mb-8 flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-sky-500" />
          1. Resumen General
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Estado del Negocio */}
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-zinc-400" />
              Estado del Negocio
            </h3>
            <div className="p-8 bg-zinc-50 rounded-[32px] border border-zinc-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BarChart3 className="w-24 h-24" />
              </div>
              <p className="text-zinc-600 font-medium leading-relaxed relative z-10">
                Durante los últimos <span className="text-zinc-900 font-extrabold">{days} días</span>, el sistema ha procesado un total de <span className="text-zinc-900 font-extrabold">{totalBookings} reservas</span>, generando un ingreso total de <span className="text-emerald-600 font-extrabold">{formatCurrency(totalIncome)}</span>. La ocupación promedio se mantiene en un <span className="text-sky-600 font-extrabold">{occupancyRate.toFixed(1)}%</span>.
              </p>
            </div>
          </div>

          {/* Rendimiento por Cancha */}
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              <PieChart className="w-5 h-5 text-zinc-400" />
              Rendimiento por Cancha
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {pitchData.length > 0 ? pitchData.map((pitch, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:border-zinc-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-extrabold text-zinc-400 text-xs">
                      0{idx + 1}
                    </div>
                    <span className="font-bold text-zinc-900">{pitch.name}</span>
                  </div>
                  <span className="font-extrabold text-zinc-900">{formatCurrency(pitch.income)}</span>
                </div>
              )) : (
                <div className="text-center py-4 text-zinc-400 text-sm">
                  No hay canchas registradas.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartStats;
