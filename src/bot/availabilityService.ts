import { dataService } from '../services/dataService';
import { format, parseISO, addDays, startOfDay, isBefore } from 'date-fns';

export async function getAvailableSlots(dateStr: string, pitchId: string): Promise<string[]> {
  const date = parseISO(dateStr);
  const bookings = await dataService.getBookings();
  
  // Filter bookings for this pitch and date
  const dayBookings = bookings.filter(b => 
    b.pitchId === pitchId && 
    b.status !== 'cancelled' &&
    format(b.startTime, 'yyyy-MM-dd') === dateStr
  );

  const availableSlots: string[] = [];
  const now = new Date();
  const isToday = format(now, 'yyyy-MM-dd') === dateStr;

  // Generate slots from 09:00 to 23:00
  for (let hour = 9; hour <= 23; hour++) {
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);

    // Skip past hours if today
    if (isToday && isBefore(slotTime, now)) {
      continue;
    }

    // Check if slot is booked
    const isBooked = dayBookings.some(b => {
      const bStart = new Date(b.startTime);
      return bStart.getHours() === hour;
    });

    if (!isBooked) {
      availableSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
  }

  return availableSlots;
}

export function generateNextDays(daysCount: number = 7): { label: string, value: string }[] {
  const days = [];
  const today = startOfDay(new Date());
  
  for (let i = 0; i < daysCount; i++) {
    const date = addDays(today, i);
    days.push({
      label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : format(date, 'dd/MM/yyyy'),
      value: format(date, 'yyyy-MM-dd')
    });
  }
  
  return days;
}
