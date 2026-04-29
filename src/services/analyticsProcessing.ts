import { format, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking, Sale, Pitch } from '../types';

export const getAdvancedStats = (
  bookings: Booking[] = [],
  sales: Sale[] = [],
  pitches: Pitch[] = [],
  timeRange: 'este_mes' | 'mes_anterior' | 'historico' = 'este_mes'
) => {
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
      const totalPossibleSlots = (pitches?.length || 0) * 15 * 30;
      data.ocupacion = totalPossibleSlots > 0 ? Math.round((data.reservas / totalPossibleSlots) * 100) : 0;
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
      const totalPossibleSlots = (pitches?.length || 0) * 15;
      const occupancyRate = totalPossibleSlots > 0 ? (dayBookings.length / totalPossibleSlots) * 100 : 0;

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
    const occupancy = (daysCount > 0 && pitches.length > 0) ? (pBookings.length / (daysCount * 15)) * 100 : 0;
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
    alerts.push("Baja ocupación general detectada en este periodo.");
  }

  const peakHours = confirmedBookings.filter(b => b.startTime.getHours() >= 20).length;
  if (peakHours > confirmedBookings.length * 0.4) {
    alerts.push("Alta demanda en horarios nocturnos.");
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