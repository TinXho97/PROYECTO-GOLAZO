import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { db } from '../firebase';
import { Pitch, Booking } from '../types';

const PITCHES_COLLECTION = 'pitches';
const BOOKINGS_COLLECTION = 'bookings';

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const bookingService = {
  // Pitches
  subscribeToPitches: (callback: (pitches: Pitch[]) => void) => {
    const q = query(collection(db, PITCHES_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const pitches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pitch));
      callback(pitches);
    });
  },

  addPitch: async (pitch: Omit<Pitch, 'id'>) => {
    return addDoc(collection(db, PITCHES_COLLECTION), pitch);
  },

  updatePitch: async (id: string, pitch: Partial<Pitch>) => {
    return updateDoc(doc(db, PITCHES_COLLECTION, id), pitch);
  },

  // Bookings
  subscribeToBookings: (date: Date, callback: (bookings: Booking[]) => void) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('startTime', '>=', Timestamp.fromDate(startOfDay)),
      where('startTime', '<=', Timestamp.fromDate(endOfDay))
    );

    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
          createdAt: data.createdAt.toDate(),
        } as Booking;
      });
      callback(bookings);
    });
  },

  addBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    // Check for overlaps
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('pitchId', '==', booking.pitchId),
      where('status', '==', 'confirmed')
    );
    
    const snapshot = await getDocs(q);
    const existingBookings = snapshot.docs.map(doc => ({
      ...doc.data(),
      startTime: doc.data().startTime.toDate(),
      endTime: doc.data().endTime.toDate(),
    }));

    const hasOverlap = existingBookings.some(existing => {
      return (
        (booking.startTime >= existing.startTime && booking.startTime < existing.endTime) ||
        (booking.endTime > existing.startTime && booking.endTime <= existing.endTime) ||
        (booking.startTime <= existing.startTime && booking.endTime >= existing.endTime)
      );
    });

    if (hasOverlap) {
      throw new Error('Ya existe una reserva en este horario para esta cancha.');
    }

    return addDoc(collection(db, BOOKINGS_COLLECTION), {
      ...booking,
      startTime: Timestamp.fromDate(booking.startTime),
      endTime: Timestamp.fromDate(booking.endTime),
      createdAt: Timestamp.now(),
    });
  },

  updateBooking: async (id: string, booking: Partial<Booking>) => {
    const updateData: any = { ...booking };
    if (booking.startTime) updateData.startTime = Timestamp.fromDate(booking.startTime);
    if (booking.endTime) updateData.endTime = Timestamp.fromDate(booking.endTime);
    
    return updateDoc(doc(db, BOOKINGS_COLLECTION, id), updateData);
  },

  deleteBooking: async (id: string) => {
    return deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
  }
};
