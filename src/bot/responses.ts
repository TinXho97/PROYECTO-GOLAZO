export interface BotResponse {
  text: string;
  options?: { label: string; value: string }[];
  metadata?: any;
}

export interface BookingSummary {
  pitchName: string;
  dateLabel: string;
  time: string;
  clientName: string;
  clientPhone: string;
  status?: string;
}

const startOptions = [
  { label: 'Crear reserva', value: 'crear reserva' },
  { label: 'Ver horarios disponibles', value: 'ver horarios disponibles' },
  { label: 'Ver canchas', value: 'ver canchas' },
  { label: 'Ayuda', value: 'ayuda' },
];

export const responses = {
  greeting: (): BotResponse => ({
    text: 'Hola, soy LIO. Puedo ayudarte a crear una reserva, consultar horarios disponibles o ver canchas.',
    options: startOptions,
  }),

  help: (): BotResponse => ({
    text: 'Puedo guiarte paso a paso para crear una reserva. También puedo mostrarte canchas y horarios disponibles.',
    options: startOptions,
  }),

  pitchList: (pitches: { id: string; name: string }[]): BotResponse => ({
    text: pitches.length
      ? 'Estas son las canchas disponibles del complejo:'
      : 'No hay canchas activas para este complejo.',
    options: pitches.length ? pitches.map((p) => ({ label: p.name, value: p.id })) : startOptions,
  }),
  
  askPitch: (pitches: { id: string; name: string }[]): BotResponse => ({
    text: pitches.length
      ? 'Elegí una cancha para continuar:'
      : 'No hay canchas activas para crear reservas en este complejo.',
    options: pitches.length ? pitches.map((p) => ({ label: p.name, value: p.id })) : startOptions,
  }),

  invalidPitch: (pitches: { id: string; name: string }[]): BotResponse => ({
    text: 'No encontré esa cancha en este complejo. Elegí una de estas opciones:',
    options: pitches.map((p) => ({ label: p.name, value: p.id })),
  }),

  askDate: (): BotResponse => ({
    text: '¿Para qué fecha querés consultar? Podés escribir hoy, mañana, 15/05, 15/05/2026 o un día como viernes.',
  }),

  invalidDate: (): BotResponse => ({
    text: 'No pude interpretar esa fecha o es una fecha pasada. Probá con hoy, mañana, 15/05 o viernes.',
  }),

  askTime: (slots: string[]): BotResponse => ({
    text: 'Estos son los horarios disponibles. Elegí uno:',
    options: slots.map((s) => ({ label: s, value: s })),
  }),

  noSlots: (): BotResponse => ({
    text: 'No hay horarios disponibles para esa cancha y fecha.',
    options: [
      { label: 'Cambiar fecha', value: 'cambiar fecha' },
      { label: 'Cambiar cancha', value: 'cambiar cancha' },
      { label: 'Cancelar', value: 'cancelar' },
    ],
  }),

  availabilityOnly: (pitchName: string, dateLabel: string, slots: string[]): BotResponse => ({
    text: slots.length
      ? `Horarios disponibles para ${pitchName} el ${dateLabel}: ${slots.join(', ')}.`
      : `No hay horarios disponibles para ${pitchName} el ${dateLabel}.`,
    options: [
      { label: 'Crear reserva', value: 'crear reserva' },
      { label: 'Cambiar fecha', value: 'cambiar fecha' },
      { label: 'Cambiar cancha', value: 'cambiar cancha' },
      { label: 'Inicio', value: 'inicio' },
    ],
  }),

  invalidTime: (slots: string[]): BotResponse => ({
    text: slots.length
      ? 'Ese horario no está disponible. Elegí uno de estos horarios:'
      : 'Ese horario no está disponible y no quedan alternativas para esa fecha.',
    options: slots.length
      ? slots.map((s) => ({ label: s, value: s }))
      : [
          { label: 'Cambiar fecha', value: 'cambiar fecha' },
          { label: 'Cambiar cancha', value: 'cambiar cancha' },
        ],
  }),

  askClientName: (): BotResponse => ({
    text: 'Para crear la reserva necesito el nombre del jugador. Escribilo como querés que figure en la reserva.',
  }),

  invalidClientName: (): BotResponse => ({
    text: 'Necesito un nombre real. No puede estar vacío ni ser "Cliente".',
  }),

  askClientPhone: (): BotResponse => ({
    text: 'Ahora pasame un teléfono real de contacto para la reserva.',
  }),

  invalidClientPhone: (): BotResponse => ({
    text: 'Ese teléfono no parece válido. Usá al menos 7 números y no uses 0000000000.',
  }),

  confirmBooking: (summary: BookingSummary): BotResponse => ({
    text:
      `Confirmá la reserva:\n` +
      `Cancha: ${summary.pitchName}\n` +
      `Fecha: ${summary.dateLabel}\n` +
      `Horario: ${summary.time}\n` +
      `Nombre: ${summary.clientName}\n` +
      `Teléfono: ${summary.clientPhone}`,
    options: [
      { label: 'Confirmar reserva', value: 'confirmar reserva' },
      { label: 'Cambiar cancha', value: 'cambiar cancha' },
      { label: 'Cambiar fecha', value: 'cambiar fecha' },
      { label: 'Cambiar horario', value: 'cambiar horario' },
      { label: 'Cambiar datos del jugador', value: 'cambiar datos del jugador' },
      { label: 'Cancelar', value: 'cancelar' },
    ],
  }),

  bookingSuccess: (summary: BookingSummary): BotResponse => ({
    text:
      `Reserva creada correctamente.\n` +
      `Cancha: ${summary.pitchName}\n` +
      `Fecha: ${summary.dateLabel}\n` +
      `Horario: ${summary.time}\n` +
      `Nombre: ${summary.clientName}\n` +
      `Teléfono: ${summary.clientPhone}\n` +
      `Estado: ${summary.status || 'pendiente'}`,
    options: startOptions,
  }),

  bookingError: (): BotResponse => ({
    text: 'Hubo un error al crear la reserva o el horario ya fue ocupado. Probá nuevamente.',
    options: [
      { label: 'Cambiar horario', value: 'cambiar horario' },
      { label: 'Crear reserva', value: 'crear reserva' },
      { label: 'Inicio', value: 'inicio' },
    ],
  }),

  missingClient: (): BotResponse => ({
    text: 'No puedo operar porque tu usuario no tiene un complejo asignado. Revisá el clientId del administrador antes de usar el asistente.',
  }),

  invalidContactData: (): BotResponse => ({
    text: 'No puedo crear la reserva sin nombre y teléfono reales. Volvamos a cargar esos datos.',
    options: [
      { label: 'Crear reserva', value: 'crear reserva' },
    ],
  }),

  cancel: (): BotResponse => ({
    text: 'Listo, cancelé el flujo actual. ¿Qué querés hacer ahora?',
    options: startOptions,
  }),
  
  unknown: (): BotResponse => ({
    text: 'No entendí tu solicitud. Podés usar estas opciones:',
    options: startOptions,
  }),
};
