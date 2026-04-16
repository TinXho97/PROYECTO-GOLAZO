import { getUserState, updateUserState, clearUserState } from './stateManager';
import { detectIntent } from './intentDetector';
import { responses, BotResponse } from './responses';
import { dataService } from '../services/dataService';
import { getAvailableSlots, generateNextDays } from './availabilityService';
import { createBooking } from './bookingService';

export async function handleFlow(userId: string, message: string, clientName: string, clientPhone: string): Promise<BotResponse> {
  const state = getUserState(userId);
  const intent = detectIntent(message);

  // Global commands
  if (intent === 'greeting') {
    clearUserState(userId);
    return responses.greeting();
  }
  
  if (message.toLowerCase() === 'cancel' || message.toLowerCase() === 'cancelar') {
    clearUserState(userId);
    return responses.cancel();
  }

  // Handle flow based on current step
  switch (state.step) {
    case 'idle':
      if (intent === 'book_pitch' || message === 'reservar') {
        const pitches = await dataService.getPitches();
        const activePitches = pitches.filter(p => p.active);
        updateUserState(userId, { step: 'ask_pitch' });
        return responses.askPitch(activePitches.map(p => ({ id: p.id, name: p.name })));
      }
      return responses.unknown();

    case 'ask_pitch':
      const pitches = await dataService.getPitches();
      const selectedPitch = pitches.find(p => p.id === message || p.name.toLowerCase() === message.toLowerCase());
      
      if (selectedPitch) {
        updateUserState(userId, { step: 'ask_date', pitch_id: selectedPitch.id });
        const days = generateNextDays(7);
        return responses.askDate(days);
      }
      return responses.askPitch(pitches.filter(p=>p.active).map(p => ({ id: p.id, name: p.name })));

    case 'ask_date':
      if (message === 'back_to_date') {
        const days = generateNextDays(7);
        return responses.askDate(days);
      }
      // Assuming message is a valid date string (yyyy-MM-dd) from the options
      if (message.match(/^\d{4}-\d{2}-\d{2}$/)) {
        updateUserState(userId, { step: 'ask_time', date: message });
        const slots = await getAvailableSlots(message, state.pitch_id!);
        return responses.askTime(slots);
      }
      return responses.askDate(generateNextDays(7));

    case 'ask_time':
      if (message === 'back_to_date') {
        updateUserState(userId, { step: 'ask_date', date: null });
        return responses.askDate(generateNextDays(7));
      }
      // Assuming message is a valid time string (HH:mm)
      if (message.match(/^\d{2}:\d{2}$/)) {
        updateUserState(userId, { step: 'confirm', time: message });
        const allPitches = await dataService.getPitches();
        const pName = allPitches.find(p => p.id === state.pitch_id)?.name || 'Cancha';
        return responses.confirmBooking(pName, state.date!, message);
      }
      const slots = await getAvailableSlots(state.date!, state.pitch_id!);
      return responses.askTime(slots);

    case 'confirm':
      if (message === 'confirm') {
        try {
          await createBooking(
            userId,
            state.pitch_id!,
            state.date!,
            state.time!,
            clientName,
            clientPhone
          );
          clearUserState(userId);
          return responses.bookingSuccess();
        } catch (error) {
          clearUserState(userId);
          return responses.bookingError();
        }
      } else if (message === 'cancel') {
        clearUserState(userId);
        return responses.cancel();
      }
      return responses.confirmBooking("la cancha", state.date!, state.time!);

    default:
      clearUserState(userId);
      return responses.greeting();
  }
}
