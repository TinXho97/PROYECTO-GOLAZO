export function detectIntent(message: string): string {
  const normalized = message
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.match(/cancelar|salir|empezar de nuevo|reiniciar|inicio/)) return 'reset';
  if (normalized.match(/confirmar reserva|^confirmar$|^confirm$|si confirmar/)) return 'confirm_booking';
  if (normalized.match(/cambiar cancha/)) return 'change_pitch';
  if (normalized.match(/cambiar fecha/)) return 'change_date';
  if (normalized.match(/cambiar horario|cambiar hora/)) return 'change_time';
  if (normalized.match(/cambiar datos|jugador/)) return 'change_player';
  if (normalized.match(/ver canchas|canchas/)) return 'view_pitches';
  if (normalized.match(/horarios|disponibilidad|disponibles/)) return 'view_availability';
  if (normalized.match(/crear reserva|reservar|reserva|turno|alquilar/)) return 'book_pitch';
  if (normalized.match(/hola|buenas|que tal|buenas tardes|buen dia/)) return 'greeting';
  if (normalized.match(/ayuda|info/)) return 'help';

  return 'unknown';
}
