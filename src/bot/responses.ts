export interface BotResponse {
  text: string;
  options?: { label: string; value: string }[];
  metadata?: any;
}

export const responses = {
  greeting: (): BotResponse => ({
    text: '¡Hola! Soy el asistente virtual. ¿En qué te puedo ayudar?',
    options: [
      { label: 'Reservar Cancha', value: 'reservar' },
      { label: 'Ayuda', value: 'ayuda' }
    ]
  }),
  
  askPitch: (pitches: { id: string, name: string }[]): BotResponse => ({
    text: 'Por favor, elegí una cancha:',
    options: pitches.map(p => ({ label: p.name, value: p.id }))
  }),

  askDate: (days: { label: string, value: string }[]): BotResponse => ({
    text: '¿Para qué día querés reservar?',
    options: days
  }),

  askTime: (slots: string[]): BotResponse => {
    if (slots.length === 0) {
      return {
        text: 'Lo siento, no hay horarios disponibles para ese día. Por favor, elegí otro día.',
        options: [{ label: 'Volver a elegir día', value: 'back_to_date' }]
      };
    }
    return {
      text: 'Estos son los horarios disponibles. Elegí uno:',
      options: slots.map(s => ({ label: s, value: s }))
    };
  },

  confirmBooking: (pitchName: string, date: string, time: string): BotResponse => ({
    text: `Vas a reservar la ${pitchName} para el día ${date} a las ${time} hs. ¿Confirmar?`,
    options: [
      { label: 'Sí, confirmar', value: 'confirm' },
      { label: 'No, cancelar', value: 'cancel' }
    ]
  }),

  bookingSuccess: (): BotResponse => ({
    text: '¡Reserva confirmada con éxito! Te esperamos.',
    options: [
      { label: 'Hacer otra reserva', value: 'reservar' }
    ]
  }),

  bookingError: (): BotResponse => ({
    text: 'Hubo un error al procesar tu reserva o el horario ya fue ocupado. Por favor, intentá de nuevo.',
    options: [
      { label: 'Volver a intentar', value: 'reservar' }
    ]
  }),

  cancel: (): BotResponse => ({
    text: 'Operación cancelada. ¿En qué más te puedo ayudar?',
    options: [
      { label: 'Reservar Cancha', value: 'reservar' }
    ]
  }),
  
  unknown: (): BotResponse => ({
    text: 'No entendí tu solicitud. Podés usar los botones para navegar.',
    options: [
      { label: 'Reservar Cancha', value: 'reservar' }
    ]
  })
};
