import { dataService } from './dataService';
import { startOfDay, endOfDay, format, eachDayOfInterval, subDays, isSameDay } from 'date-fns';
import { Booking, Pitch, Sale } from '../types';

export interface AnalyticsData {
  totalBookings: number;
  bookingsByDay: Record<string, number>;
  bookingsByHour: Record<number, number>;
  bookingsByDayOfWeek: Record<number, number>;
  totalIncome: number;
  incomeByDay: Record<string, number>;
  incomeByPitch: Record<string, number>;
  pitchNames: Record<string, string>;
  mostUsedHours: { hour: number; count: number }[];
  leastUsedHours: { hour: number; count: number }[];
  occupancyRate: number;
  averageOccupancy: number;
  averageIncomePerDay: number;
  averageIncomePerBooking: number;
  lostIncomeEstimation: number;
  peakHours: number[];
  lowDemandHours: number[];
  strongestDay: string;
  weakestDay: string;
  insights: string[];
  recommendations: string[];
  alerts: string[];
  projections: {
    monthly: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export const analyticsService = {
  getAnalytics: async (days: number = 30, clientId?: string): Promise<AnalyticsData> => {
    const [bookingsRaw, pitches, sales] = await Promise.all([
      dataService.getBookings(clientId),
      dataService.getPitches(clientId),
      dataService.getSales(clientId)
    ]);
    const bookings = bookingsRaw.filter(b => b.status !== 'cancelled');
    
    const now = new Date();
    const startDate = subDays(now, days);
    
    // Filter data for the last X days
    const recentBookings = bookings.filter(b => b.startTime >= startDate);
    const recentSales = sales.filter(s => s.date >= startDate);
    
    // 1. Basic Metrics
    const totalBookings = recentBookings.length;
    
    const bookingsByDay: Record<string, number> = {};
    const bookingsByDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const incomeByDay: Record<string, number> = {};
    const incomeByPitch: Record<string, number> = {};
    const bookingsByHour: Record<number, number> = {};
    
    // Initialize days
    const interval = eachDayOfInterval({ start: startDate, end: now });
    interval.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      bookingsByDay[dayStr] = 0;
      incomeByDay[dayStr] = 0;
    });
    
    const pitchNames: Record<string, string> = {};
    pitches.forEach(p => {
      incomeByPitch[p.id] = 0;
      pitchNames[p.id] = p.name;
    });
    
    // Process Bookings
    recentBookings.forEach(b => {
      const dayStr = format(b.startTime, 'yyyy-MM-dd');
      const hour = b.startTime.getHours();
      const dayOfWeek = b.startTime.getDay();
      const pitch = pitches.find(p => p.id === b.pitchId);
      const price = pitch?.price || 0;
      
      bookingsByDay[dayStr] = (bookingsByDay[dayStr] || 0) + 1;
      bookingsByDayOfWeek[dayOfWeek] = (bookingsByDayOfWeek[dayOfWeek] || 0) + 1;
      incomeByDay[dayStr] = (incomeByDay[dayStr] || 0) + price;
      incomeByPitch[b.pitchId] = (incomeByPitch[b.pitchId] || 0) + price;
      bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;
    });
    
    // Process Sales
    recentSales.forEach(s => {
      const dayStr = format(s.date, 'yyyy-MM-dd');
      incomeByDay[dayStr] = (incomeByDay[dayStr] || 0) + s.totalPrice;
    });
    
    const totalIncome = Object.values(incomeByDay).reduce((acc, val) => acc + val, 0);
    
    // 2. Advanced Metrics
    const totalPossibleSlotsPerDay = pitches.length * 14; // 14 hours available
    const totalPossibleSlots = totalPossibleSlotsPerDay * days;
    const occupancyRate = totalPossibleSlots > 0 ? (totalBookings / totalPossibleSlots) * 100 : 0;
    
    const averageIncomePerDay = totalIncome / days;
    const averageIncomePerBooking = totalBookings > 0 ? totalIncome / totalBookings : 0;
    
    // Lost Income Estimation (Empty slots * average pitch price)
    const avgPitchPrice = pitches.length > 0 ? pitches.reduce((acc, p) => acc + p.price, 0) / pitches.length : 0;
    const emptySlots = totalPossibleSlots - totalBookings;
    const lostIncomeEstimation = emptySlots * avgPitchPrice;
    
    const hourStats = Object.entries(bookingsByHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);
      
    const mostUsedHours = hourStats.slice(0, 3);
    const leastUsedHours = [...hourStats].reverse().slice(0, 3);
    
    const peakHours = mostUsedHours.map(h => h.hour);
    const lowDemandHours = leastUsedHours.map(h => h.hour);
    
    // Day of week analysis
    const daysNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const sortedDaysOfWeek = Object.entries(bookingsByDayOfWeek)
      .sort((a, b) => b[1] - a[1]);
    
    const strongestDay = daysNames[parseInt(sortedDaysOfWeek[0][0])];
    const weakestDay = daysNames[parseInt(sortedDaysOfWeek[sortedDaysOfWeek.length - 1][0])];

    // Projections
    const dailyRate = totalIncome / days;
    const monthlyProjection = dailyRate * 30;
    
    // Trend analysis (compare last 7 days vs previous 7 days)
    const last7Days = recentBookings.filter(b => b.startTime >= subDays(now, 7)).length;
    const prev7Days = recentBookings.filter(b => b.startTime >= subDays(now, 14) && b.startTime < subDays(now, 7)).length;
    const trend = last7Days > prev7Days ? 'up' : last7Days < prev7Days ? 'down' : 'stable';
    
    // 3. Insights & Recommendations
    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];
    
    if (totalBookings === 0) {
      insights.push("No hay datos suficientes para un análisis detallado.");
    } else {
      insights.push(`El ticket promedio por reserva es de ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(averageIncomePerBooking)}.`);
      insights.push(`Se estima una pérdida de ingresos de ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(lostIncomeEstimation)} por turnos no vendidos.`);
      
      pitches.forEach(p => {
        const pitchIncome = incomeByPitch[p.id];
        if (pitchIncome < (totalIncome / pitches.length) * 0.5) {
          insights.push(`La ${p.name} rinde un 50% menos que el promedio.`);
          recommendations.push(`Promocionar la ${p.name} con un precio reducido temporalmente.`);
        }
      });
      
      if (peakHours.length > 0) {
        recommendations.push(`Aumentar tarifa en horarios pico (${peakHours.join(', ')}hs) para maximizar margen.`);
      }
      
      if (lowDemandHours.length > 0) {
        recommendations.push(`Lanzar "Happy Hour" a las ${lowDemandHours.join(', ')}hs con 20% de descuento.`);
      }
      
      if (occupancyRate < 40) {
        alerts.push("⚠️ Alerta: Ocupación crítica por debajo del 40%.");
      }
    }
    
    return {
      totalBookings,
      bookingsByDay,
      bookingsByHour,
      bookingsByDayOfWeek,
      totalIncome,
      incomeByDay,
      incomeByPitch,
      pitchNames,
      mostUsedHours,
      leastUsedHours,
      occupancyRate,
      averageOccupancy: occupancyRate,
      averageIncomePerDay,
      averageIncomePerBooking,
      lostIncomeEstimation,
      peakHours,
      lowDemandHours,
      strongestDay,
      weakestDay,
      insights,
      recommendations,
      alerts,
      projections: {
        monthly: monthlyProjection,
        trend
      }
    };
  }
};
