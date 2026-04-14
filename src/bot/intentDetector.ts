export function detectIntent(message: string): string {
  const normalized = message.toLowerCase().trim();
  
  if (normalized.match(/reservar|reserva|turno|alquilar/)) return 'book_pitch';
  if (normalized.match(/hola|buenas|qué tal|buenas tardes|buen día/)) return 'greeting';
  if (normalized.match(/cancelar|baja/)) return 'cancel_booking';
  if (normalized.match(/ayuda|info/)) return 'help';
  
  return 'unknown';
}
