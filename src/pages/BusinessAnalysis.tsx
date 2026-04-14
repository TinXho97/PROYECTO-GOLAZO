import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Clock, 
  BarChart3, 
  PieChart, 
  ArrowRight,
  Zap,
  Target,
  Activity,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { analyticsService, AnalyticsData } from '../services/analyticsService';
import { dataService } from '../services/dataService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BusinessAnalysis: React.FC = () => {
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
  }, [days, user?.client_id]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium animate-pulse">Analizando datos reales...</p>
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

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase italic">
            📊 Análisis del Negocio
          </h1>
          <p className="text-zinc-500 font-medium mt-1">
            Inteligencia de datos basada en el sistema de reservas real.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl self-start">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                days === d 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Últimos {d} días
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Ingresos Totales" 
          value={formatCurrency(data.totalIncome)} 
          icon={<DollarSign className="w-5 h-5" />}
          trend={data.totalIncome > 0 ? "up" : "neutral"}
          subtitle={`Promedio: ${formatCurrency(data.averageIncomePerDay)}/día`}
        />
        <StatCard 
          title="Reservas Totales" 
          value={data.totalBookings.toString()} 
          icon={<Calendar className="w-5 h-5" />}
          trend="neutral"
          subtitle={`${(data.totalBookings / days).toFixed(1)} reservas/día`}
        />
        <StatCard 
          title="Ocupación Promedio" 
          value={`${data.occupancyRate.toFixed(1)}%`} 
          icon={<PieChart className="w-5 h-5" />}
          trend={data.occupancyRate > 50 ? "up" : "down"}
          subtitle="Basado en horarios disponibles"
        />
        <StatCard 
          title="Horario Pico" 
          value={data.peakHours.length > 0 ? `${data.peakHours[0]}:00 hs` : "N/A"} 
          icon={<Clock className="w-5 h-5" />}
          trend="neutral"
          subtitle="Mayor demanda detectada"
        />
      </div>

      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.alerts.map((alert, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={`p-4 rounded-2xl border flex items-center gap-4 ${
                alert.includes('⚠️') 
                  ? 'bg-amber-50 border-amber-200 text-amber-900' 
                  : 'bg-orange-50 border-orange-200 text-orange-900'
              }`}
            >
              <div className={`p-2 rounded-xl ${alert.includes('⚠️') ? 'bg-amber-100' : 'bg-orange-100'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm">{alert}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analysis Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Resumen General */}
          <section className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Activity className="w-32 h-32" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-zinc-900 uppercase mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              1. Resumen General
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Estado del Negocio</p>
                  <p className="text-zinc-700 leading-relaxed">
                    Durante los últimos {days} días, el sistema ha procesado un total de <span className="font-bold text-zinc-900">{data.totalBookings} reservas</span>, 
                    generando un ingreso total de <span className="font-bold text-zinc-900">{formatCurrency(data.totalIncome)}</span>. 
                    La ocupación promedio se mantiene en un <span className="font-bold text-zinc-900">{data.occupancyRate.toFixed(1)}%</span>.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rendimiento por Cancha</p>
                  <div className="space-y-2">
                    {Object.entries(data.incomeByPitch).map(([id, income]) => (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600">{data.pitchNames[id] || `Cancha ${id.replace('p', '')}`}</span>
                        <span className="font-bold text-zinc-900">{formatCurrency(income as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Problemas Detectados */}
          <section className="bg-zinc-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <TrendingDown className="w-32 h-32" />
            </div>
            <h2 className="text-xl font-black tracking-tight uppercase mb-6 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-red-400" />
              2. Problemas Detectados
            </h2>
            <div className="space-y-3">
              {data.insights.filter(i => i.includes('bajo') || i.includes('menos') || i.includes('No hay')).map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-sm text-zinc-300 font-medium">{insight}</p>
                </div>
              ))}
              {data.insights.filter(i => i.includes('bajo') || i.includes('menos') || i.includes('No hay')).length === 0 && (
                <p className="text-zinc-500 italic text-sm">No se han detectado problemas críticos con los datos actuales.</p>
              )}
            </div>
          </section>

          {/* Oportunidades */}
          <section className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-900 uppercase mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-500" />
              3. Oportunidades
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Horarios a Potenciar</p>
                <div className="flex flex-wrap gap-2">
                  {data.lowDemandHours.map(h => (
                    <span key={h} className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-indigo-600 shadow-sm">
                      {h}:00 hs
                    </span>
                  ))}
                  {data.lowDemandHours.length === 0 && <span className="text-xs text-indigo-400 italic">No hay datos suficientes</span>}
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Horarios de Éxito</p>
                <div className="flex flex-wrap gap-2">
                  {data.peakHours.map(h => (
                    <span key={h} className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-emerald-600 shadow-sm">
                      {h}:00 hs
                    </span>
                  ))}
                  {data.peakHours.length === 0 && <span className="text-xs text-emerald-400 italic">No hay datos suficientes</span>}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Recommendations Sidebar */}
        <div className="space-y-8">
          <section className="bg-zinc-100 rounded-3xl p-6 border border-zinc-200 h-full">
            <h2 className="text-xl font-black tracking-tight text-zinc-900 uppercase mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              4. Recomendaciones
            </h2>
            <div className="space-y-4">
              {data.recommendations.map((rec, idx) => (
                <motion.div 
                  whileHover={{ x: 5 }}
                  key={idx} 
                  className="p-4 bg-white rounded-2xl shadow-sm border border-zinc-200 flex gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 leading-tight">{rec}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span>Acción Sugerida</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </motion.div>
              ))}
              {data.recommendations.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-400 text-sm italic">Esperando más datos para generar recomendaciones estratégicas...</p>
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-zinc-900 rounded-2xl text-white">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Nota del Asistente</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Este análisis se actualiza automáticamente cada 30 segundos con los datos más recientes del sistema.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, subtitle }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-zinc-100 rounded-xl text-zinc-600">
        {icon}
      </div>
      {trend !== 'neutral' && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend === 'up' ? '+%' : '-%'}
        </div>
      )}
    </div>
    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-1">{value}</h3>
    <p className="text-[10px] font-medium text-zinc-500">{subtitle}</p>
  </motion.div>
);

export default BusinessAnalysis;
