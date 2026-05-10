import { api } from '../services/dataService';
import { getAvailableSlots } from './availabilityService';
import { parseISO, setHours } from 'date-fns';

const isInvalidPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.length < 7 || digits.length > 15 || /^0+$/.test(digits);
};

export async function createBooking(
  userId: string,
  pitchId: string,
  dateStr: string,
  timeStr: string,
  clientName: string,
  clientPhone: string,
  clientId: string,
) {
  const normalizedName = clientName.trim();
  const normalizedPhone = clientPhone.trim();

  if (!clientId) {
    throw new Error('MISSING_CLIENT_ID');
  }

  if (!normalizedName || normalizedName.toLowerCase() === 'cliente') {
    throw new Error('INVALID_CLIENT_NAME');
  }

  if (!normalizedPhone || isInvalidPhone(normalizedPhone)) {
    throw new Error('INVALID_CLIENT_PHONE');
  }

  // 1. Double check availability to prevent race conditions
  const availableSlots = await getAvailableSlots(dateStr, pitchId, clientId);
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
    clientName: normalizedName,
    clientPhone: normalizedPhone,
    startTime,
    endTime,
    status: 'pending' as const,
    isPaid: false,
    client_id: clientId,
  };

  await api.addBooking(newBooking, clientId);
  return true;
}
