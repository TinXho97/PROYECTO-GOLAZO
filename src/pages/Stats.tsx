import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  MessageSquare, 
  Send, 
  Bot, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  Sparkles,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, isSameDay, startOfMonth, endOfMonth, subMonths, subYears, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { dataService } from '../services/dataService';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { cn } from '../lib/utils';

export default function StatsPage() {
  const [user, setUser] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'este_mes' | 'mes_anterior' | 'historico'>('este_mes');
  const [bookings, setBookings] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [pitches, setPitches] = useState<any[]>([]);
  
  useEffect(() => {
    dataService.getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const clientId = user?.client_id;
      const [fetchedBookings, fetchedSales, fetchedPitches] = await Promise.all([
        dataService.getBookings(clientId),
        dataService.getSales(clientId),
        dataService.getPitches(clientId)
      ]);
      setBookings(fetchedBookings);
      setSales(fetchedSales);
      setPitches(fetchedPitches);
    };
    fetchData();
  }, [user]);
  
  // Real-time Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisRange, setAnalysisRange] = useState<'7days' | '30days' | 'month'>('7days');
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    insights: { title: string; text: string; type: 'info' | 'success' | 'warning' }[];
    recommendations: string[];
  } | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const now = new Date();
    let start: Date;
    if (analysisRange === '7days') start = subDays(now, 7);
    else if (analysisRange === '30days') start = subDays(now, 30);
    else start = startOfMonth(now);

    const periodBookings = bookings.filter(b => b.status === 'confirmed' && b.startTime >= start && b.startTime <= now);
    const periodSales = sales.filter(s => s.date >= start && s.date <= now);

    const insights: { title: string; text: string; type: 'info' | 'success' | 'warning' }[] = [];
    const recommendations: string[] = [];

    // 1. Occupancy Analysis
    const dayOccupancy: Record<number, number> = {}; // 0-6
    const hourOccupancy: Record<number, number> = {}; // 0-23
    
    periodBookings.forEach(b => {
      const day = b.startTime.getDay();
      const hour = b.startTime.getHours();
      dayOccupancy[day] = (dayOccupancy[day] || 0) + 1;
      hourOccupancy[hour] = (hourOccupancy[hour] || 0) + 1;
    });

    // Find low/high demand
    const days = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
    const sortedDays = Object.entries(dayOccupancy).sort((a, b) => b[1] - a[1]);
    const sortedHours = Object.entries(hourOccupancy).sort((a, b) => b[1] - a[1]);

    const totalPeriodBookings = periodBookings.length || 1;

    if (sortedDays.length > 0) {
      const bestDayIdx = parseInt(sortedDays[0][0]);
      const bestDay = days[bestDayIdx];
      const bestDayPercent = Math.round((sortedDays[0][1] / totalPeriodBookings) * 100);
      
      const worstDayIdx = parseInt(sortedDays[sortedDays.length - 1][0]);
      const worstDay = days[worstDayIdx];
      const worstDayPercent = Math.round((sortedDays[sortedDays.length - 1][1] / totalPeriodBookings) * 100);

      insights.push({
        title: `Alta demanda los ${bestDay}`,
        text: `Los ${bestDay.toLowerCase()} concentran el ${bestDayPercent}% de tus reservas. Es el día más fuerte del periodo.`,
        type: 'success'
      });
      insights.push({
        title: `Oportunidad los ${worstDay}`,
        text: `Los ${worstDay.toLowerCase()} solo representan el ${worstDayPercent}% de la actividad. Hay margen para crecer.`,
        type: 'info'
      });
    }

    if (sortedHours.length > 0) {
      const peakHour = parseInt(sortedHours[0][0]);
      const peakHourPercent = Math.round((sortedHours[0][1] / totalPeriodBookings) * 100);
      
      const lowHour = parseInt(sortedHours[sortedHours.length - 1][0]);
      const lowHourPercent = Math.round((sortedHours[sortedHours.length - 1][1] / totalPeriodBookings) * 100);

      insights.push({
        title: `Horario Pico: ${peakHour}:00 hs`,
        text: `Esta franja horaria capta el ${peakHourPercent}% de la demanda total.`,
        type: 'warning'
      });
      insights.push({
        title: `Baja ocupación: ${lowHour}:00 hs`,
        text: `Solo el ${lowHourPercent}% de las reservas ocurren a esta hora.`,
        type: 'info'
      });
    }

    // 2. Pitch Performance
    const pitchIncome: Record<string, number> = {};
    periodBookings.forEach(b => {
      const pitch = pitches.find(p => p.id === b.pitchId);
      if (pitch) {
        pitchIncome[pitch.name] = (pitchIncome[pitch.name] || 0) + pitch.price;
      }
    });

    const sortedPitches = Object.entries(pitchIncome).sort((a, b) => b[1] - a[1]);
    if (sortedPitches.length > 1) {
      insights.push({
        title: "Rendimiento de Canchas",
        text: `La ${sortedPitches[0][0]} genera un ${Math.round((sortedPitches[0][1] / (sortedPitches[0][1] + sortedPitches[1][1])) * 100)}% más de ingresos que la ${sortedPitches[1][0]}.`,
        type: 'success'
      });
    }

    // 3. Recommendations
    recommendations.push("Ajustar precios dinámicos en horarios de baja demanda para incentivar reservas.");
    recommendations.push("Ofrecer beneficios exclusivos (como hidratación o pelotas bonificadas) en horarios vacíos.");
    recommendations.push("Aprovechar horarios de alta demanda para ofrecer servicios adicionales de buffet.");
    recommendations.push("Incentivar la reserva anticipada para los fines de semana mediante notificaciones.");

    setAnalysisResult({ insights, recommendations });
    setLastAnalysisTime(new Date());
    setIsAnalyzing(false);
  };

  // Advanced Data Processing
  const getAdvancedStats = () => {
    const now = new Date();
    let start: Date, end: Date;

    if (timeRange === 'este_mes') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (timeRange === 'mes_anterior') {
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
    } else {
      // historico
      start = new Date(2020, 0, 1); // A date far in the past
      end = now;
    }

    // For historical view, we might not want to show every single day in the chart if it's too long,
    // but for simplicity we'll group by month if it's historical, or day otherwise.
    const isHistorical = timeRange === 'historico';
    
    // Filter by createdAt for bookings as requested, but we still need to know when the booking was for occupancy.
    // The prompt says "estadísticas por mes usando created_at". We will use createdAt for the period filtering.
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' && b.createdAt >= start && b.createdAt <= end);
    const periodSales = sales.filter(s => s.date >= start && s.date <= end);

    // 1. Basic Chart Data
    let chartData: any[] = [];
    
    if (isHistorical) {
      // Group by month
      const monthsMap: Record<string, any> = {};
      confirmedBookings.forEach(b => {
        const monthKey = format(b.createdAt, 'yyyy-MM');
        if (!monthsMap[monthKey]) monthsMap[monthKey] = { name: format(b.createdAt, 'MMM yy', { locale: es }), ingresos: 0, reservas: 0, ventas: 0, ocupacion: 0, count: 0 };
        const pitch = pitches.find(p => p.id === b.pitchId);
        monthsMap[monthKey].ingresos += (pitch?.price || 0);
        monthsMap[monthKey].reservas += 1;
        monthsMap[monthKey].count += 1;
      });
      periodSales.forEach(s => {
        const monthKey = format(s.date, 'yyyy-MM');
        if (!monthsMap[monthKey]) monthsMap[monthKey] = { name: format(s.date, 'MMM yy', { locale: es }), ingresos: 0, reservas: 0, ventas: 0, ocupacion: 0, count: 0 };
        monthsMap[monthKey].ventas += s.totalPrice;
        monthsMap[monthKey].ingresos += s.totalPrice;
      });
      chartData = Object.keys(monthsMap).sort().map(k => {
        const data = monthsMap[k];
        // Rough occupancy for a month
        const totalPossibleSlots = pitches.length * 15 * 30;
        data.ocupacion = Math.round((data.reservas / totalPossibleSlots) * 100);
        return data;
      });
    } else {
      const interval = eachDayOfInterval({ start, end });
      chartData = interval.map(date => {
        const dayBookings = confirmedBookings.filter(b => isSameDay(b.createdAt, date));
        const daySales = periodSales.filter(s => isSameDay(s.date, date));
        
        const bookingIncome = dayBookings.reduce((acc, b) => {
          const pitch = pitches.find(p => p.id === b.pitchId);
          return acc + (pitch?.price || 0);
        }, 0);
        
        const productIncome = daySales.reduce((acc, s) => acc + s.totalPrice, 0);
        const totalIncome = bookingIncome + productIncome;

        // Occupancy calculation (assuming 15 possible slots per day per pitch)
        const totalPossibleSlots = pitches.length * 15;
        const occupancyRate = (dayBookings.length / totalPossibleSlots) * 100;

        return {
          name: format(date, 'dd/MM', { locale: es }),
          ingresos: totalIncome,
          reservas: dayBookings.length,
          ventas: productIncome,
          ocupacion: Math.round(occupancyRate)
        };
      });
    }

    // 2. Key Metrics
    const totalIncome = chartData.reduce((acc, d) => acc + d.ingresos, 0);
    const avgDailyIncome = chartData.length > 0 ? totalIncome / chartData.length : 0;
    const avgOccupancy = chartData.length > 0 ? chartData.reduce((acc, d) => acc + d.ocupacion, 0) / chartData.length : 0;

    // 3. Hourly Analysis
    const hourCounts: Record<number, number> = {};
    const hourIncome: Record<number, number> = {};
    
    confirmedBookings.forEach(b => {
      const hour = b.startTime.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      const pitch = pitches.find(p => p.id === b.pitchId);
      hourIncome[hour] = (hourIncome[hour] || 0) + (pitch?.price || 0);
    });

    const sortedHoursByIncome = Object.entries(hourIncome).sort((a, b) => b[1] - a[1]);
    const sortedHoursByCount = Object.entries(hourCounts).sort((a, b) => a[1] - b[1]);

    const mostProfitableHour = sortedHoursByIncome[0] ? `${sortedHoursByIncome[0][0]}:00 hs` : 'N/A';
    const leastOccupiedHour = sortedHoursByCount[0] ? `${sortedHoursByCount[0][0]}:00 hs` : 'N/A';

    // 4. Pitch Performance
    const pitchPerformance = pitches.map(p => {
      const pBookings = confirmedBookings.filter(b => b.pitchId === p.id);
      const income = pBookings.reduce((acc, b) => acc + p.price, 0);
      const daysCount = isHistorical ? 365 : eachDayOfInterval({ start, end }).length;
      const occupancy = (pBookings.length / (daysCount * 15)) * 100;
      return {
        name: p.name,
        income,
        occupancy: Math.round(occupancy)
      };
    }).sort((a, b) => b.income - a.income);

    // 5. Prediction (Simple linear extrapolation)
    const intervalDays = eachDayOfInterval({ start, end });
    const daysPassed = intervalDays.filter(d => d <= now).length;
    const dailyRate = totalIncome / (daysPassed || 1);
    const predictedMonthly = dailyRate * 30;

    // 6. Insights & Alerts
    const insights = [];
    const alerts = [];

    // Tuesday 14-17 check (example)
    const lowOccupancyTuesdays = confirmedBookings.filter(b => b.startTime.getDay() === 2 && b.startTime.getHours() >= 14 && b.startTime.getHours() <= 17).length;
    if (lowOccupancyTuesdays < (intervalDays.length / 7) * 2) {
      insights.push({
        title: "Baja ocupación los Martes",
        text: "Los martes de 14:00 a 17:00 tienen baja ocupación. Podrías ofrecer beneficios o descuentos por hora para aumentar reservas.",
        type: 'opportunity'
      });
    }

    if (avgOccupancy > 80) {
      insights.push({
        title: "Alta demanda detectada",
        text: "Tu ocupación promedio es excelente. Considera un pequeño ajuste de precios en horarios pico para maximizar margen.",
        type: 'success'
      });
    }

    if (avgOccupancy < 40) {
      alerts.push("⚠️ Baja ocupación general detectada en este periodo.");
    }

    const peakHours = confirmedBookings.filter(b => b.startTime.getHours() >= 20).length;
    if (peakHours > confirmedBookings.length * 0.4) {
      alerts.push("🔥 Alta demanda en horarios nocturnos.");
    }

    // 7. Time Distribution
    const distribution = [
      { name: 'Mañana (10-14)', value: confirmedBookings.filter(b => b.startTime.getHours() < 14).length },
      { name: 'Tarde (14-19)', value: confirmedBookings.filter(b => b.startTime.getHours() >= 14 && b.startTime.getHours() < 19).length },
      { name: 'Noche (19-01)', value: confirmedBookings.filter(b => b.startTime.getHours() >= 19).length },
    ];

    return {
      chartData,
      metrics: {
        avgDailyIncome,
        avgOccupancy,
        mostProfitableHour,
        leastOccupiedHour,
        predictedMonthly
      },
      pitchPerformance,
      insights,
      alerts,
      distribution
    };
  };

  const stats = getAdvancedStats();
  const COLORS = ['#0ea5e9', '#3b82f6', '#a855f7', '#f59e0b'];

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tighter">Estadísticas Avanzadas</h1>
          <p className="text-zinc-500 font-medium text-sm sm:text-base">Panel inteligente de gestión y decisiones</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm overflow-x-auto">
            {(['este_mes', 'mes_anterior', 'historico'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-black transition-all uppercase tracking-widest flex items-center justify-center gap-1 sm:gap-2",
                  timeRange === range 
                    ? "bg-argentina text-zinc-900 shadow-lg shadow-sky-500/20" 
                    : "text-zinc-400 hover:text-zinc-900"
                )}
              >
                {timeRange === range && (
                  <div className="w-3 h-2 sm:w-4 sm:h-3 rounded-[2px] overflow-hidden flex flex-col shadow-sm shrink-0">
                    <div className="h-1/3 bg-[#74acdf]" />
                    <div className="h-1/3 bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-yellow-400" />
                    </div>
                    <div className="h-1/3 bg-[#74acdf]" />
                  </div>
                )}
                {range === 'este_mes' ? 'Este Mes' : range === 'mes_anterior' ? 'Mes Anterior' : 'Histórico'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-2xl shadow-xl">
            <select 
              value={analysisRange}
              onChange={(e) => setAnalysisRange(e.target.value as any)}
              className="bg-transparent text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-2 outline-none border-none cursor-pointer"
            >
              <option value="7days" className="bg-zinc-900">7 días</option>
              <option value="30days" className="bg-zinc-900">30 días</option>
              <option value="month" className="bg-zinc-900">Mes</option>
            </select>
            <Button 
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className={cn(
                "bg-sky-500 hover:bg-sky-400 text-white border-none rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 h-auto font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center gap-1 sm:gap-2 transition-all",
                isAnalyzing && "opacity-50 cursor-not-allowed"
              )}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  <span className="hidden sm:inline">Analizando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">Analizar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Analysis Results Section */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-none shadow-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-[32px] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                      <Sparkles className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">📊 Análisis del negocio</h3>
                      <p className="text-sky-400/60 text-[10px] font-black uppercase tracking-[0.2em]">Inteligencia de Datos en Tiempo Real</p>
                    </div>
                  </div>
                  {lastAnalysisTime && (
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Análisis actualizado {format(lastAnalysisTime, "HH:mm 'hs'", { locale: es })}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="flex flex-col gap-12">
                  {/* Insights Section */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Hallazgos Clave (Datos orientativos)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {analysisResult.insights.map((insight, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/[0.08] transition-colors group relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-white to-sky-400 opacity-20" />
                          <div className="flex items-center gap-2 mb-3">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full shadow-lg",
                              insight.type === 'success' ? "bg-emerald-500 shadow-emerald-500/20" : 
                              insight.type === 'warning' ? "bg-amber-500 shadow-amber-500/20" : "bg-sky-500 shadow-sky-500/20"
                            )} />
                            <h5 className="font-black text-white text-sm group-hover:text-sky-400 transition-colors">{insight.title}</h5>
                          </div>
                          <p className="text-zinc-400 text-xs leading-relaxed font-medium">{insight.text}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations Section */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Sugerencias de Acción
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {analysisResult.recommendations.map((rec, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + (i * 0.1) }}
                          className="flex items-start gap-4 bg-sky-500/10 border border-sky-500/20 p-6 rounded-3xl hover:bg-sky-500/15 transition-all group"
                        >
                          <div className="mt-1 bg-sky-500/20 p-1.5 rounded-lg group-hover:bg-sky-500/30 transition-colors">
                            <ChevronRight className="w-4 h-4 text-sky-400" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Recomendación {i + 1}</span>
                            <p className="text-sky-100 text-sm font-bold leading-tight">{rec}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl inline-block">
                      <p className="text-[10px] font-bold text-amber-200/60 uppercase tracking-widest leading-normal flex items-center gap-2">
                        * Los datos presentados son estimaciones basadas en el historial reciente. Se recomienda validar con el contexto actual del negocio antes de aplicar cambios.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights Section (Static Recommendations) */}
      <Card className="border-none shadow-lg bg-zinc-900 rounded-[32px] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">📊 Recomendaciones para mejorar ingresos</h3>
              <p className="text-sky-400/60 text-sm font-bold uppercase tracking-widest">Asistente Inteligente Golazo</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.insights.map((insight, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={insight.type === 'success' ? 'success' : 'neutral'} className="bg-sky-500 text-white border-none">
                    {insight.type === 'success' ? 'Sugerencia' : 'Oportunidad'}
                  </Badge>
                  <h4 className="font-black text-white">{insight.title}</h4>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{insight.text}</p>
              </div>
            ))}
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-black text-white text-lg">Predicción de Cierre</h4>
                <p className="text-white/80 text-sm">Si mantenés este ritmo, este mes cerrarías con:</p>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-white">${Math.round(stats.metrics.predictedMonthly).toLocaleString()}</span>
                <div className="flex items-center gap-1 text-white/60 text-[10px] font-bold uppercase tracking-tighter mt-1">
                  <TrendingUp className="w-3 h-3" />
                  Estimación basada en tendencia actual
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <AnimatePresence>
        {stats.alerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3"
          >
            {stats.alerts.map((alert, i) => (
              <div key={i} className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="text-sm font-bold text-amber-700">{alert}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue & Occupancy Chart */}
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900">Análisis de Ocupación e Ingresos</h3>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Rendimiento diario</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase">Ocupación %</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e5e7eb', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#ffffff'
                  }}
                />
                <Bar yAxisId="left" dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="ocupacion" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pitch Performance */}
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0">
              <h3 className="text-xl font-black text-zinc-900">Rendimiento por Cancha</h3>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Comparativa de ingresos</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {stats.pitchPerformance.map((p, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-zinc-900">{p.name}</span>
                        {i === 0 && <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-none text-[8px]">TOP</Badge>}
                      </div>
                      <span className="text-sm font-black text-zinc-900">${p.income.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          i === 0 ? "bg-emerald-500" : "bg-zinc-300"
                        )}
                        style={{ width: `${p.occupancy}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Ocupación</span>
                      <span className="text-[10px] font-black text-zinc-600">{p.occupancy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Distribution */}
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0">
              <h3 className="text-xl font-black text-zinc-900">Distribución Horaria</h3>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Mañana vs Tarde vs Noche</p>
            </CardHeader>
            <CardContent className="p-8 h-[250px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={stats.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-zinc-900">
                  {stats.distribution.reduce((acc, d) => acc + d.value, 0)}
                </span>
                <span className="text-[10px] font-black text-zinc-400 uppercase">Turnos</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Metrics Grid (Moved to Bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ingreso Promedio / Día</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900">${Math.round(stats.metrics.avgDailyIncome).toLocaleString()}</span>
              <span className="text-[10px] font-bold text-emerald-600">Basado en periodo actual</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ocupación Promedio</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900">{Math.round(stats.metrics.avgOccupancy)}%</span>
              <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.metrics.avgOccupancy}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Horario más Rentable</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900">{stats.metrics.mostProfitableHour}</span>
              <span className="text-[10px] font-bold text-purple-600">Mayor volumen de ingresos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Horario Menor Ocupación</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900">{stats.metrics.leastOccupiedHour}</span>
              <span className="text-[10px] font-bold text-orange-600">Oportunidad de promociones</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
