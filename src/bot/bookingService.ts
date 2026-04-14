import { dataService, api } from '../services/dataService';
import { getAvailableSlots } from './availabilityService';
import { parseISO, setHours } from 'date-fns';

export async function createBooking(userId: string, pitchId: string, dateStr: string, timeStr: string, clientName: string, clientPhone: string) {
  // 1. Double check availability to prevent race conditions
  const availableSlots = await getAvailableSlots(dateStr, pitchId);
  if (!availableSlots.includes(timeStr)) {
    throw new Error('SLOT_TAKEN');
  }

  // 2. Prepare dates
  const hour = parseInt(timeStr.split(':')[0], 10);
  const startTime = setHours(parseISO(dateStr), hour);
  const endTime = setHours(parseISO(dateStr), hour + 1);

  // 3. Create booking
  const newBooking = {
    pitchId,
    userId,
    clientName,
    clientPhone,
    startTime,
    endTime,
    status: 'pending' as const,
    isPaid: false,
  };

  await api.addBooking(newBooking);
  return true;
}
