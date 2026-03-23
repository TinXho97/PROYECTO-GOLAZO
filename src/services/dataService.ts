import { Pitch, Booking, Product, Sale, User, AuditLog } from '../types';
import { addHours, startOfDay, endOfDay, isSameDay } from 'date-fns';

// Initial Mock Data
const MOCK_PITCHES: Pitch[] = [
  { id: 'p1', name: 'Cancha 1', type: 'F5', price: 1500, active: true },
  { id: 'p2', name: 'Cancha 2', type: 'F5', price: 1500, active: true },
  { id: 'p3', name: 'Cancha 3', type: 'F7', price: 2200, active: true },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'pr1', name: 'Agua Mineral 500ml', price: 200, category: 'bebida' },
  { id: 'pr2', name: 'Gatorade 500ml', price: 350, category: 'bebida' },
  { id: 'pr3', name: 'Coca Cola 500ml', price: 300, category: 'bebida' },
  { id: 'pr4', name: 'Cerveza 1L', price: 800, category: 'bebida' },
];

// Helper to get from localStorage or use mock
const getStorage = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return initial;
  try {
    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects
    return parsed.map((item: any) => {
      const newItem = { ...item };
      if (newItem.startTime) newItem.startTime = new Date(newItem.startTime);
      if (newItem.endTime) newItem.endTime = new Date(newItem.endTime);
      if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt);
      if (newItem.date) newItem.date = new Date(newItem.date);
      return newItem;
    });
  } catch {
    return initial;
  }
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dataService = {
  // Pitches
  getPitches: () => getStorage<Pitch[]>('golazo_pitches', MOCK_PITCHES),
  savePitches: (pitches: Pitch[]) => setStorage('golazo_pitches', pitches),
  
  // Bookings
  getBookings: () => getStorage<Booking[]>('golazo_bookings', []),
  saveBookings: (bookings: Booking[]) => setStorage('golazo_bookings', bookings),
  
  // Products
  getProducts: () => getStorage<Product[]>('golazo_products', MOCK_PRODUCTS),
  saveProducts: (products: Product[]) => setStorage('golazo_products', products),
  
  // Sales
  getSales: () => getStorage<Sale[]>('golazo_sales', []),
  saveSales: (sales: Sale[]) => setStorage('golazo_sales', sales),

  // Auth Simulation
  getCurrentUser: () => {
    const user = localStorage.getItem('golazo_user');
    if (!user) return null;
    try {
      return JSON.parse(user) as User;
    } catch {
      return null;
    }
  },
  login: (email: string) => {
    const role = email === 'admin@gmail.com' ? 'admin' : 'client';
    const name = email === 'admin@gmail.com' ? 'Administrador' : (email === 'cliente@gmail.com' ? 'Cliente VIP' : email.split('@')[0]);
    const user: User = { 
      id: email, // Use email as ID for simplicity in points tracking
      email, 
      name, 
      role 
    };
    localStorage.setItem('golazo_user', JSON.stringify(user));
    return user;
  },
  logout: () => {
    localStorage.removeItem('golazo_user');
  },

  // Loyalty & Ranking
  getUserPoints: (userId: string) => {
    const bookings = dataService.getBookings();
    // 1 point per confirmed booking, 1.5 for promotional hours (10-16)
    return bookings
      .filter(b => b.userId === userId && b.status === 'confirmed')
      .reduce((acc, b) => {
        const hour = b.startTime.getHours();
        const isPromo = hour >= 10 && hour <= 16;
        return acc + (isPromo ? 1.5 : 1);
      }, 0);
  },

  getRanking: () => {
    const bookings = dataService.getBookings();
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    
    const userStats: Record<string, { id: string, name: string, points: number }> = {};
    
    confirmedBookings.forEach(b => {
      if (!userStats[b.userId]) {
        userStats[b.userId] = { 
          id: b.userId, 
          name: b.clientName || b.userId.split('@')[0], 
          points: 0 
        };
      }
      const hour = b.startTime.getHours();
      const isPromo = hour >= 10 && hour <= 16;
      userStats[b.userId].points += isPromo ? 1.5 : 1;
    });

    return Object.values(userStats).sort((a, b) => b.points - a.points);
  },

  // Audit Logs
  getAuditLogs: () => getStorage<AuditLog[]>('golazo_audit_logs', []),
  saveAuditLogs: (logs: AuditLog[]) => setStorage('golazo_audit_logs', logs),
  logAction: (action: string, details: string) => {
    const logs = dataService.getAuditLogs();
    const user = dataService.getCurrentUser();
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      details,
      timestamp: new Date(),
      user: user?.name || 'Sistema'
    };
    dataService.saveAuditLogs([newLog, ...logs].slice(0, 100)); // Keep last 100
  }
};

// High level API
export const api = {
  // Bookings
  addBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const bookings = dataService.getBookings();
    
    // Overlap check
    const hasOverlap = bookings.some(existing => {
      if (existing.pitchId !== booking.pitchId || existing.status === 'cancelled') return false;
      return (
        (booking.startTime >= existing.startTime && booking.startTime < existing.endTime) ||
        (booking.endTime > existing.startTime && booking.endTime <= existing.endTime) ||
        (booking.startTime <= existing.startTime && booking.endTime >= existing.endTime)
      );
    });

    if (hasOverlap) throw new Error('Horario ocupado en esta cancha.');

    const newBooking: Booking = {
      ...booking,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    
    dataService.saveBookings([...bookings, newBooking]);
    return newBooking;
  },

  cancelBooking: async (id: string) => {
    const bookings = dataService.getBookings();
    const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    dataService.saveBookings(updated);
  },

  // Sales
  addSale: async (productId: string, quantity: number) => {
    const products = dataService.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error('Producto no encontrado');

    const sales = dataService.getSales();
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      quantity,
      totalPrice: product.price * quantity,
      date: new Date(),
    };
    
    dataService.saveSales([...sales, newSale]);
    return newSale;
  },

  deleteSale: async (id: string) => {
    const sales = dataService.getSales();
    const sale = sales.find(s => s.id === id);
    dataService.saveSales(sales.filter(s => s.id !== id));
    dataService.logAction('Venta Eliminada', `Se eliminó la venta de ${sale?.productId || id}`);
  },

  // Products CRUD
  addProduct: async (product: Omit<Product, 'id'>) => {
    const products = dataService.getProducts();
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    dataService.saveProducts([...products, newProduct]);
    dataService.logAction('Producto Creado', `Se creó el producto ${product.name}`);
    return newProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    const products = dataService.getProducts();
    const product = products.find(p => p.id === id);
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    dataService.saveProducts(updated);
    dataService.logAction('Producto Actualizado', `Se actualizó el producto ${product?.name || id}`);
  },

  deleteProduct: async (id: string) => {
    const products = dataService.getProducts();
    const product = products.find(p => p.id === id);
    dataService.saveProducts(products.filter(p => p.id !== id));
    dataService.logAction('Producto Eliminado', `Se eliminó el producto ${product?.name || id}`);
  },

  // Pitches CRUD
  addPitch: async (pitch: Omit<Pitch, 'id'>) => {
    const pitches = dataService.getPitches();
    const newPitch = { ...pitch, id: Math.random().toString(36).substr(2, 9) };
    dataService.savePitches([...pitches, newPitch]);
    dataService.logAction('Cancha Creada', `Se creó la cancha ${pitch.name}`);
    return newPitch;
  },

  updatePitch: async (id: string, updates: Partial<Pitch>) => {
    const pitches = dataService.getPitches();
    const pitch = pitches.find(p => p.id === id);
    const updated = pitches.map(p => p.id === id ? { ...p, ...updates } : p);
    dataService.savePitches(updated);
    dataService.logAction('Cancha Actualizada', `Se actualizó la cancha ${pitch?.name || id}`);
  },

  deletePitch: async (id: string) => {
    const pitches = dataService.getPitches();
    const pitch = pitches.find(p => p.id === id);
    dataService.savePitches(pitches.filter(p => p.id !== id));
    dataService.logAction('Cancha Eliminada', `Se eliminó la cancha ${pitch?.name || id}`);
  }
};
