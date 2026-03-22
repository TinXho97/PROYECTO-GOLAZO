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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, isSameDay, startOfMonth, endOfMonth, subMonths, subYears, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { dataService } from '../services/dataService';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { cn } from '../lib/utils';

interface StatsPageProps {
  isDarkMode?: boolean;
}

export default function StatsPage({ isDarkMode }: StatsPageProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [bookings, setBookings] = useState(dataService.getBookings());
  const [sales, setSales] = useState(dataService.getSales());
  const [pitches, setPitches] = useState(dataService.getPitches());
  
  // Data Processing
  const getStatsData = () => {
    const now = new Date();
    let start: Date, end: Date;

    if (timeRange === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
    } else if (timeRange === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else {
      start = startOfYear(now);
      end = endOfYear(now);
    }

    const interval = eachDayOfInterval({ start, end });
    
    return interval.map(date => {
      const dayBookings = bookings.filter(b => isSameDay(b.startTime, date) && b.status === 'confirmed');
      const daySales = sales.filter(s => isSameDay(s.date, date));
      
      const bookingIncome = dayBookings.reduce((acc, b) => {
        const pitch = pitches.find(p => p.id === b.pitchId);
        return acc + (pitch?.price || 0);
      }, 0);
      
      const productIncome = daySales.reduce((acc, s) => acc + s.totalPrice, 0);

      return {
        name: format(date, timeRange === 'year' ? 'MMM' : 'dd/MM', { locale: es }),
        ingresos: bookingIncome + productIncome,
        reservas: dayBookings.length,
        ventas: productIncome
      };
    });
  };

  const chartData = getStatsData();

  // Frequent Days Data
  const getFrequentDays = () => {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    bookings.filter(b => b.status === 'confirmed').forEach(b => {
      dayCounts[b.startTime.getDay()]++;
    });
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dayCounts.map((count, i) => ({ name: dayNames[i], count }));
  };

  const frequentDaysData = getFrequentDays();

  const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b'];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">Estadísticas Avanzadas</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Análisis detallado de tu complejo deportivo</p>
        </div>

        <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-widest",
                timeRange === range 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-zinc-900">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Ingresos Totales</h3>
                <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Canchas + Bar</p>
              </div>
              <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-black">+12.5%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#f4f4f5"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                    color: isDarkMode ? '#f4f4f5' : '#18181b'
                  }}
                  itemStyle={{ fontWeight: 800 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#22c55e" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: isDarkMode ? '#18181b' : '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Frequency Chart */}
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-zinc-900">
            <CardHeader className="p-8 pb-0">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Días más Frecuentados</h3>
              <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Ocupación por día</p>
            </CardHeader>
            <CardContent className="p-8 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequentDaysData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: isDarkMode ? '#27272a' : '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                      color: isDarkMode ? '#f4f4f5' : '#18181b'
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales Distribution */}
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-zinc-900">
            <CardHeader className="p-8 pb-0">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Distribución de Ventas</h3>
              <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Canchas vs Bar</p>
            </CardHeader>
            <CardContent className="p-8 h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Canchas', value: chartData.reduce((acc, d) => acc + (d.ingresos - d.ventas), 0) },
                      { name: 'Bar', value: chartData.reduce((acc, d) => acc + d.ventas, 0) }
                    ]}
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
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">100%</span>
                <span className="text-[10px] font-black text-zinc-400 uppercase">Total</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
