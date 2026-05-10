import { addDays, format, isBefore, isValid, parse, startOfDay } from 'date-fns';
import { getUserState, updateUserState, clearUserState } from './stateManager';
import { detectIntent } from './intentDetector';
import { responses, BotResponse, BookingSummary } from './responses';
import { dataService } from '../services/dataService';
import { getAvailableSlots } from './availabilityService';
import { createBooking } from './bookingService';
import type { BotContext } from '.';
import type { Pitch } from '../types';

const normalizeText = (value?: string | null) => value?.trim() || '';
const normalizeForMatch = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const isInvalidName = (value?: string | null) => {
  const normalized = normalizeText(value);
  return !normalized || normalizeForMatch(normalized) === 'cliente';
};

const phoneDigits = (value?: string | null) => normalizeText(value).replace(/\D/g, '');
const isInvalidPhone = (value?: string | null) => {
  const digits = phoneDigits(value);
  return digits.length < 7 || digits.length > 15 || /^0+$/.test(digits);
};

const getActivePitches = async (clientId: string) => {
  const pitches = await dataService.getPitches(clientId);
  return pitches.filter((pitch) => pitch.active);
};

const findPitch = (message: string, pitches: Pitch[]) => {
  const normalized = normalizeForMatch(message);
  return pitches.find((pitch) =>
    pitch.id === message ||
    normalizeForMatch(pitch.name) === normalized ||
    normalizeForMatch(pitch.name).includes(normalized)
  );
};

const weekdays = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

const parseBotDate = (message: string) => {
  const today = startOfDay(new Date());
  const normalized = normalizeForMatch(message);

  if (normalized === 'hoy') return today;
  if (normalized === 'manana' || normalized === 'mañana') return addDays(today, 1);

  const weekdayIndex = weekdays.indexOf(normalized);
  if (weekdayIndex >= 0) {
    const diff = (weekdayIndex - today.getDay() + 7) % 7;
    return addDays(today, diff);
  }

  const formats = ['dd/MM/yyyy', 'd/M/yyyy', 'dd/MM', 'd/M'];
  for (const dateFormat of formats) {
    const parsed = parse(message, dateFormat, today);
    if (!isValid(parsed)) continue;
    return startOfDay(parsed);
  }

  return null;
};

const toDateStr = (date: Date) => format(date, 'yyyy-MM-dd');
const toDateLabel = (dateStr: string) => format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy');

const buildSummary = (state: ReturnType<typeof getUserState>): BookingSummary => ({
  pitchName: state.pitchName || 'Cancha',
  dateLabel: state.date ? toDateLabel(state.date) : '',
  time: state.time || '',
  clientName: state.clientName || '',
  clientPhone: state.clientPhone || '',
});

const askForPitch = async (userId: string, clientId: string, intent: string): Promise<BotResponse> => {
  const pitches = await getActivePitches(clientId);
  if (pitches.length === 0) {
    clearUserState(userId);
    return responses.askPitch([]);
  }

  if (pitches.length === 1) {
    const pitch = pitches[0];
    updateUserState(userId, {
      step: 'ask_date',
      intent,
      clientId,
      pitch_id: pitch.id,
      pitchName: pitch.name,
    });
    return {
      text: `Seleccioné automáticamente la cancha ${pitch.name}. ¿Para qué fecha querés continuar? Podés escribir hoy, mañana, 15/05 o viernes.`,
    };
  }

  updateUserState(userId, { step: 'ask_pitch', intent, clientId });
  return responses.askPitch(pitches.map((pitch) => ({ id: pitch.id, name: pitch.name })));
};

const askForTime = async (userId: string, clientId: string, dateStr: string, pitchId: string): Promise<BotResponse> => {
  const slots = await getAvailableSlots(dateStr, pitchId, clientId);
  if (slots.length === 0) {
    updateUserState(userId, { step: 'ask_time' });
    return responses.noSlots();
  }

  updateUserState(userId, { step: 'ask_time' });
  return responses.askTime(slots);
};

const continueToContactOrConfirm = async (
  userId: string,
  contextClientName: string,
  contextClientPhone: string,
): Promise<BotResponse> => {
  const state = getUserState(userId);
  const nextName = state.clientName || contextClientName;
  const nextPhone = state.clientPhone || contextClientPhone;

  updateUserState(userId, {
    clientName: nextName,
    clientPhone: nextPhone,
  });

  if (isInvalidName(nextName)) {
    updateUserState(userId, { step: 'ask_client_name' });
    return responses.askClientName();
  }

  if (isInvalidPhone(nextPhone)) {
    updateUserState(userId, { step: 'ask_client_phone' });
    return responses.askClientPhone();
  }

  updateUserState(userId, { step: 'confirm' });
  return responses.confirmBooking(buildSummary(getUserState(userId)));
};

export async function handleFlow(userId: string, message: string, context: BotContext): Promise<BotResponse> {
  const state = getUserState(userId);
  const intent = detectIntent(message);
  const clientId = normalizeText(context.clientId || state.clientId);
  const contextClientName = normalizeText(context.clientName);
  const contextClientPhone = normalizeText(context.clientPhone);

  if (intent === 'reset') {
    clearUserState(userId);
    return responses.cancel();
  }

  if (intent === 'greeting') {
    clearUserState(userId);
    return responses.greeting();
  }

  if (intent === 'help') {
    return responses.help();
  }

  if (!clientId) {
    clearUserState(userId);
    return responses.missingClient();
  }

  if (intent === 'view_pitches') {
    const pitches = await getActivePitches(clientId);
    return responses.pitchList(pitches.map((pitch) => ({ id: pitch.id, name: pitch.name })));
  }

  if (intent === 'book_pitch' && state.step === 'idle') {
    return askForPitch(userId, clientId, 'book_pitch');
  }

  if (intent === 'view_availability' && state.step === 'idle') {
    return askForPitch(userId, clientId, 'view_availability');
  }

  if (intent === 'change_pitch') {
    return askForPitch(userId, clientId, state.intent || 'book_pitch');
  }

  if (intent === 'change_date') {
    if (!state.pitch_id) return askForPitch(userId, clientId, state.intent || 'book_pitch');
    updateUserState(userId, { step: 'ask_date', date: null, time: null });
    return responses.askDate();
  }

  if (intent === 'change_time') {
    if (!state.pitch_id) return askForPitch(userId, clientId, state.intent || 'book_pitch');
    if (!state.date) {
      updateUserState(userId, { step: 'ask_date' });
      return responses.askDate();
    }
    return askForTime(userId, clientId, state.date, state.pitch_id);
  }

  if (intent === 'change_player') {
    updateUserState(userId, { step: 'ask_client_name', clientName: null, clientPhone: null });
    return responses.askClientName();
  }

  switch (state.step) {
    case 'idle':
      return responses.unknown();

    case 'ask_pitch': {
      const pitches = await getActivePitches(clientId);
      const selectedPitch = findPitch(message, pitches);
      if (!selectedPitch) {
        return responses.invalidPitch(pitches.map((pitch) => ({ id: pitch.id, name: pitch.name })));
      }

      updateUserState(userId, {
        step: 'ask_date',
        clientId,
        pitch_id: selectedPitch.id,
        pitchName: selectedPitch.name,
      });
      return responses.askDate();
    }

    case 'ask_date': {
      const parsedDate = parseBotDate(message);
      const today = startOfDay(new Date());
      if (!parsedDate || isBefore(parsedDate, today)) {
        return responses.invalidDate();
      }

      const dateStr = toDateStr(parsedDate);
      updateUserState(userId, { date: dateStr, time: null });

      if (!state.pitch_id) return askForPitch(userId, clientId, state.intent || 'book_pitch');

      const slots = await getAvailableSlots(dateStr, state.pitch_id, clientId);
      if (state.intent === 'view_availability') {
        updateUserState(userId, { step: 'idle' });
        return responses.availabilityOnly(state.pitchName || 'Cancha', toDateLabel(dateStr), slots);
      }

      if (slots.length === 0) {
        updateUserState(userId, { step: 'ask_time' });
        return responses.noSlots();
      }

      updateUserState(userId, { step: 'ask_time' });
      return responses.askTime(slots);
    }

    case 'ask_time': {
      if (!state.pitch_id || !state.date) {
        updateUserState(userId, { step: state.pitch_id ? 'ask_date' : 'ask_pitch' });
        return state.pitch_id ? responses.askDate() : askForPitch(userId, clientId, state.intent || 'book_pitch');
      }

      const slots = await getAvailableSlots(state.date, state.pitch_id, clientId);
      if (!slots.includes(message)) {
        return responses.invalidTime(slots);
      }

      updateUserState(userId, { time: message });
      return continueToContactOrConfirm(userId, contextClientName, contextClientPhone);
    }

    case 'ask_client_name': {
      const name = normalizeText(message);
      if (isInvalidName(name)) return responses.invalidClientName();
      updateUserState(userId, { clientName: name });
      return continueToContactOrConfirm(userId, name, contextClientPhone);
    }

    case 'ask_client_phone': {
      const phone = normalizeText(message);
      if (isInvalidPhone(phone)) return responses.invalidClientPhone();
      updateUserState(userId, { clientPhone: phone });
      return continueToContactOrConfirm(userId, contextClientName, phone);
    }

    case 'confirm': {
      if (intent !== 'confirm_booking') {
        return responses.confirmBooking(buildSummary(state));
      }

      try {
        if (!state.pitch_id || !state.date || !state.time) {
          clearUserState(userId);
          return responses.bookingError();
        }

        await createBooking(
          userId,
          state.pitch_id,
          state.date,
          state.time,
          state.clientName || '',
          state.clientPhone || '',
          clientId,
        );

        const summary = buildSummary(getUserState(userId));
        clearUserState(userId);
        return responses.bookingSuccess({ ...summary, status: 'pendiente' });
      } catch (error) {
        if (error instanceof Error && error.message === 'SLOT_TAKEN' && state.date && state.pitch_id) {
          const slots = await getAvailableSlots(state.date, state.pitch_id, clientId);
          updateUserState(userId, { step: 'ask_time', time: null });
          return responses.invalidTime(slots);
        }

        clearUserState(userId);
        if (error instanceof Error && ['MISSING_CLIENT_ID', 'INVALID_CLIENT_NAME', 'INVALID_CLIENT_PHONE'].includes(error.message)) {
          return responses.invalidContactData();
        }
        return responses.bookingError();
      }
    }

    default:
      clearUserState(userId);
      return responses.greeting();
  }
}
