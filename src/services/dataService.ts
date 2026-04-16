import { Pitch, Booking, Product, Sale, User, AuditLog, BookingStatus, Client } from '../types';
import { addHours, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { supabaseService } from './supabaseService';

import { supabase, getSupabaseDiagnostics } from '../lib/supabase';


// Initial Mock Data (Fallback)
const MOCK_PITCHES: Pitch[] = [
  { id: 'p1', name: 'Cancha 1', type: 'F5', price: 1500, active: true },
  { id: 'p2', name: 'Cancha 2', type: 'F5', price: 1500, active: true },
  { id: 'p3', name: 'Cancha 3', type: 'F7', price: 2200, active: true },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'pr1', name: 'Agua Mineral 500ml', price: 200, category: 'bebida', stock: 50, min_stock: 10, active: true },
  { id: 'pr2', name: 'Gatorade 500ml', price: 350, category: 'bebida', stock: 30, min_stock: 5, active: true },
  { id: 'pr3', name: 'Coca Cola 500ml', price: 300, category: 'bebida', stock: 40, min_stock: 10, active: true },
  { id: 'pr4', name: 'Cerveza 1L', price: 800, category: 'bebida', stock: 20, min_stock: 5, active: true },
];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    pitchId: 'p1',
    userId: 'cliente@gmail.com',
    clientName: 'Juan Pérez',
    clientPhone: '1122334455',
    startTime: new Date(new Date().setHours(new Date().getHours() - 2)),
    endTime: new Date(new Date().setHours(new Date().getHours() - 1)),
    status: 'confirmed',
    createdAt: new Date(),
    depositAmount: 500,
    isPaid: true
  },
  {
    id: 'b2',
    pitchId: 'p2',
    userId: 'cliente@gmail.com',
    clientName: 'María García',
    clientPhone: '1199887766',
    startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
    endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
    status: 'pending',
    createdAt: new Date(),
    depositAmount: 500,
    isPaid: false
  },
  {
    id: 'b3',
    pitchId: 'p3',
    userId: 'cliente2@gmail.com',
    clientName: 'Roberto Gómez',
    clientPhone: '1155667788',
    startTime: new Date(new Date().setHours(new Date().getHours() + 4)),
    endTime: new Date(new Date().setHours(new Date().getHours() + 5)),
    status: 'confirmed',
    createdAt: new Date(),
    depositAmount: 500,
    isPaid: true
  }
];

// Helper to get from localStorage or use mock
const getStorage = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return initial;
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      // Convert date strings back to Date objects
      return parsed.map((item: any) => {
        const newItem = { ...item };
        if (newItem.startTime) newItem.startTime = new Date(newItem.startTime);
        if (newItem.endTime) newItem.endTime = new Date(newItem.endTime);
        if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt);
        if (newItem.date) newItem.date = new Date(newItem.date);
        return newItem;
      }) as unknown as T;
    }
    return parsed as T;
  } catch {
    return initial;
  }
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};
const getSaleQuantity = (sale: Sale): number => {
  if (typeof sale.quantity === 'number') return sale.quantity;
  if (Array.isArray(sale.items) && sale.items.length > 0) {
    return sale.items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  }
  return 0;
};

const isSupabaseConfigured = () => {

  const diagnostics = getSupabaseDiagnostics();
  const hasEnvVars = diagnostics.hasUrl && diagnostics.hasKey && diagnostics.validKey && !diagnostics.isDummyUrl && diagnostics.hasHttpsUrl;

  
  // If we've explicitly determined it's unreachable via health check, treat as unconfigured
  const isReachable = (window as any)._supabaseReachable !== false;
  
  const configured = hasEnvVars && isReachable;
  
  if (!configured) {
    // Only log once to avoid spam
    if (!(window as any)._supabaseWarned) {

      console.warn('[DataService] Supabase not configured or unreachable. Using LocalStorage fallback.', {
        diagnostics,
        isReachable
      });

      (window as any)._supabaseWarned = true;
    }
  }
  return configured;
};

export const dataService = {
  isSupabaseConfigured,
  checkConnection: async () => {
    if (!isSupabaseConfigured()) return false;
    return await supabaseService.testConnection();
  },
  getClientConfig: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      let query = supabase.from('clients').select('id, name, status, created_at, features');
      if (clientId) {
        query = query.eq('id', clientId);
      }
      const { data, error } = await query.limit(1).single();
      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching client config:', error);
        }
        return null;
      }
      return data as Client;
    }
    return null;
  },
  // Pitches
  getPitches: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getPitches(clientId);
      } catch (error) {
        console.error('Error fetching pitches from Supabase:', error);
      }
    }
    return getStorage<Pitch[]>('golazo_pitches', MOCK_PITCHES);
  },
  savePitches: async (pitches: Pitch[]) => {
    if (isSupabaseConfigured()) {
      // Typically handled by individual add/update/delete calls in Supabase
    }
    setStorage('golazo_pitches', pitches);
  },
  uploadPitchImage: async (file: File, pitchId: string, clientId?: string) => {
    if (isSupabaseConfigured()) {
      return await supabaseService.uploadPitchImage(file, pitchId, clientId);
    }
    // Fallback for local storage: convert to base64
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  },
  
  // Bookings
  hasCompletedBookings: async (identifier: string, clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.hasCompletedBookings(identifier, clientId);
      } catch (error) {
        console.error('Error checking completed bookings from Supabase:', error);
      }
    }
    const bookings = getStorage<Booking[]>('golazo_bookings', MOCK_BOOKINGS);
    return bookings.some(b => 
      (!clientId || b.client_id === clientId) && 
      b.status === 'completed' && 
      (b.userId === identifier || b.clientPhone === identifier || b.playerId === identifier)
    );
  },

  getBookings: async (clientId?: string, startDate?: string, endDate?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getBookings(clientId, startDate, endDate);
      } catch (error) {
        console.error('Error fetching bookings from Supabase:', error);
      }
    }
    const bookings = getStorage<Booking[]>('golazo_bookings', MOCK_BOOKINGS);
    const now = new Date();
    let hasChanges = false;

    const updatedBookings = bookings.map(b => {
      if ((b.status === 'confirmed' || b.status === 'pending') && b.endTime < now) {
        hasChanges = true;
        return { ...b, status: 'completed' as const };
      }
      return b;
    });

    if (hasChanges) {
      dataService.saveBookings(updatedBookings);
    }

    return updatedBookings.filter(b => {
      let match = true;
      if (clientId && b.client_id !== clientId) match = false;
      if (startDate && b.startTime < new Date(startDate)) match = false;
      if (endDate && b.startTime > new Date(endDate)) match = false;
      return match;
    });
  },
  saveBookings: async (bookings: Booking[]) => setStorage('golazo_bookings', bookings),
  
  // Products
  getProducts: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getProducts(clientId);
      } catch (error) {
        console.error('Error fetching products from Supabase:', error);
      }
    }
    return getStorage<Product[]>('golazo_products', MOCK_PRODUCTS);
  },
  saveProducts: async (products: Product[]) => setStorage('golazo_products', products),
  
  // Sales
  getSales: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSales(clientId);
      } catch (error) {
        console.error('Error fetching sales from Supabase:', error);
      }
    }
    const sales = getStorage<Sale[]>('golazo_sales', []);
    return sales.map(s => ({
      ...s,
      totalPrice: typeof s.totalPrice === 'object' && s.totalPrice !== null ? Number((s.totalPrice as any).total) || 0 : Number(s.totalPrice) || 0,
    }));
  },
  saveSales: async (sales: Sale[]) => setStorage('golazo_sales', sales),

  // Auth Simulation (Supabase Auth can be integrated later)
  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || 'Usuario',
      role: session.user.user_metadata?.role || 'admin',
      client_id: session.user.user_metadata?.client_id
    } as User;
  },
  login: async (identifier: string, password?: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: password || '',
    });

    if (error || !data.user) {
      throw new Error('Correo o contraseña incorrectos');
    }

    const user: User = {
      id: data.user.id,
      email: identifier,
      name: data.user.user_metadata?.name || 'Usuario',
      role: data.user.user_metadata?.role || 'admin',
      client_id: data.user.user_metadata?.client_id
    };
    
    dataService.trackOnlineUser(user);
    return user;
  },
  logout: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  },

  // Online Users Tracking (Simulation)
  getOnlineUsers: () => getStorage<User[]>('golazo_online_users', []),
  trackOnlineUser: (user: User) => {
    const online = dataService.getOnlineUsers();
    if (!online.find(u => u.id === user.id)) {
      setStorage('golazo_online_users', [...online, user]);
    }
  },
  untrackOnlineUser: (userId: string) => {
    const online = dataService.getOnlineUsers();
    setStorage('golazo_online_users', online.filter(u => u.id !== userId));
  },

  // Loyalty & Ranking
  getUserPoints: async (identifier: string, clientId?: string) => {
    const bookings = await dataService.getBookings(clientId);
    let relevantBookings = bookings.filter(b => (b.playerId === identifier || b.clientPhone === identifier || b.userId === identifier) && (b.status === 'completed' || b.status === 'no_show'));
    
    // Apply ranking reset date if available
    try {
      const clientConfig = await dataService.getClientConfig(clientId);
      if (clientConfig?.ranking_reset_date) {
        const resetDate = new Date(clientConfig.ranking_reset_date);
        relevantBookings = relevantBookings.filter(b => new Date(b.createdAt) >= resetDate);
      }
    } catch (e) {
      console.error('Error fetching client config for ranking reset date', e);
    }

    // +10 per completed, -15 per no_show
    return relevantBookings
      .reduce((acc, b) => {
        if (b.status === 'completed') return acc + 10;
        if (b.status === 'no_show') return acc - 15;
        return acc;
      }, 0);
  },

  getRanking: async (clientId?: string) => {
    const bookings = await dataService.getBookings(clientId);
    let relevantBookings = bookings.filter(b => b.status === 'completed' || b.status === 'no_show');
    
    // Apply ranking reset date if available
    try {
      const clientConfig = await dataService.getClientConfig(clientId);
      if (clientConfig?.ranking_reset_date) {
        const resetDate = new Date(clientConfig.ranking_reset_date);
        relevantBookings = relevantBookings.filter(b => new Date(b.createdAt) >= resetDate);
      }
    } catch (e) {
      console.error('Error fetching client config for ranking reset date', e);
    }
    
    const playerStats: Record<string, { id: string, name: string, points: number }> = {};
    
    relevantBookings.forEach(b => {
      // Use playerId if available, fallback to clientPhone, fallback to userId
      const identifier = b.playerId || b.clientPhone || b.userId;
      
      if (!playerStats[identifier]) {
        playerStats[identifier] = { 
          id: identifier, 
          name: b.clientName || 'Jugador', 
          points: 0 
        };
      }
      
      // Points logic: +10 per completed, -15 per no_show
      if (b.status === 'completed') {
        playerStats[identifier].points += 10;
      } else if (b.status === 'no_show') {
        playerStats[identifier].points -= 15;
      }
    });

    return Object.values(playerStats).sort((a, b) => b.points - a.points);
  },

  // Audit Logs
  getAuditLogs: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getAuditLogs(clientId);
      } catch (error) {
        console.error('Error fetching audit logs from Supabase:', error);
      }
    }
    const logs = getStorage<AuditLog[]>('golazo_audit_logs', []);
    return logs.map(l => ({
      ...l,
      timestamp: new Date(l.timestamp)
    }));
  },
  saveAuditLogs: async (logs: AuditLog[]) => setStorage('golazo_audit_logs', logs),
  logAction: async (action: string, details: string, clientId?: string) => {
    const user = await dataService.getCurrentUser();
    const targetClientId = clientId || user?.client_id;
    
    if (!targetClientId) {
      console.warn('No client_id available for logAction. Skipping log.');
      return;
    }
    
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.logAction(action, details, user?.name, targetClientId);
      } catch (error) {
        console.error('Error logging action to Supabase:', error);
      }
    }
    const logs = await dataService.getAuditLogs(targetClientId);
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      details,
      timestamp: new Date(),
      user: user?.name || 'Sistema',
      client_id: targetClientId
    };
    dataService.saveAuditLogs([newLog, ...logs].slice(0, 100)); // Keep last 100
  },

  // Deactivated Slots
  getDeactivatedSlots: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        const slots = await supabaseService.getDeactivatedSlots(clientId);
        return new Set(slots.map(s => `${s.slot_date}-${s.slot_hour}-${s.pitch_id}`));
      } catch (error) {
        console.error('Error fetching deactivated slots from Supabase:', error);
      }
    }
    return new Set<string>();
  },
  toggleDeactivatedSlot: async (pitchId: string, date: string, hour: number, clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.toggleDeactivatedSlot(pitchId, date, hour, clientId);
      } catch (error) {
        console.error('Error toggling deactivated slot in Supabase:', error);
      }
    }
  }
};

// High level API
export const api = {
  // Bookings
  addBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>, clientId?: string) => {
    const user = await dataService.getCurrentUser();
    const targetClientId = clientId || booking.client_id || user?.client_id;
    
    if (!targetClientId) {
      throw new Error('Debe seleccionar un cliente para registrar una reserva');
    }
    
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addBooking({ ...booking, client_id: targetClientId });
      } catch (error) {
        console.error('Error adding booking to Supabase:', error);
        throw error;
      }
    }
    const bookings = await dataService.getBookings(targetClientId);
    
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
      client_id: targetClientId
    };
    
    dataService.saveBookings([...bookings, newBooking]);
    return newBooking;
  },

  cancelBooking: async (id: string, clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.cancelBooking(id);
      } catch (error) {
        console.error('Error cancelling booking in Supabase:', error);
      }
    }
    const bookings = await dataService.getBookings(clientId);
    const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    dataService.saveBookings(updated);
  },

  updateBookingStatus: async (id: string, status: BookingStatus, clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updateBookingStatus(id, status);
      } catch (error) {
        console.error('Error updating booking status in Supabase:', error);
      }
    }
    const bookings = await dataService.getBookings(clientId);
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    dataService.saveBookings(updated);
    dataService.logAction('Estado de Reserva Actualizado', `Reserva ${id} cambiada a ${status}`, clientId);
  },

  toggleBookingPayment: async (id: string, clientId?: string) => {
    const bookings = await dataService.getBookings(clientId);
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.toggleBookingPayment(id, !booking.isPaid);
      } catch (error) {
        console.error('Error toggling booking payment in Supabase:', error);
      }
    }
    const updated = bookings.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b);
    dataService.saveBookings(updated);
    dataService.logAction('Pago de Reserva Actualizado', `Estado de pago de reserva ${id} cambiado`, clientId);
  },

  // Sales
  addSale: async (productId: string, quantity: number, paymentMethod?: 'efectivo' | 'transferencia', clientId?: string) => {
    const user = await dataService.getCurrentUser();
    const targetClientId = clientId || user?.client_id;
    
    if (!targetClientId) {
      throw new Error('Debe seleccionar un cliente para registrar una venta');
    }

    const products = await dataService.getProducts(targetClientId);
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error('Producto no encontrado');

    if (product.stock < quantity) {
      throw new Error('Stock insuficiente');
    }

    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addSale({
          productId,
          quantity,
          totalPrice: product.price * quantity,
          date: new Date(),
          paymentMethod,
          client_id: targetClientId
        });
      } catch (error) {
        console.error('Error adding sale to Supabase:', error);
        throw error; // Let the UI handle the error
      }
    }

    // Deduct stock locally
    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, stock: p.stock - quantity } : p
    );
    await dataService.saveProducts(updatedProducts);

    const sales = await dataService.getSales(targetClientId);
    const saleId = Math.random().toString(36).substr(2, 9);
    const newSale: Sale = {
      id: saleId,
      productId,
      quantity,
      totalPrice: product.price * quantity,
      date: new Date(),
      paymentMethod,
      client_id: targetClientId,
      items: [{
        id: Math.random().toString(36).substr(2, 9),
        saleId,
        productId,
        quantity,
        price: product.price
      }]
    };
    
    dataService.saveSales([...sales, newSale]);
    return newSale;
  },

  deleteSale: async (id: string, clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.deleteSale(id);
      } catch (error) {
        console.error('Error deleting sale from Supabase:', error);
      }
    }
    const sales = await dataService.getSales(clientId);
    const sale = sales.find(s => s.id === id);
    // Dentro de deleteSale(...)
    const saleQuantity = getSaleQuantity(sale);
    const updatedProducts = products.map(p => 
      p.id === sale.productId ? { ...p, stock: p.stock + saleQuantity } : p
    );
    

    if (sale) {
      // Restore stock locally
      const products = await dataService.getProducts(clientId);
      const updatedProducts = products.map(p => 
        p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p
      );
      await dataService.saveProducts(updatedProducts);
    }

    dataService.saveSales(sales.filter(s => s.id !== id));
    dataService.logAction('Venta Eliminada', `Se eliminó la venta de ${sale?.productId || id}`, clientId);
  },

  // Products CRUD
  addProduct: async (product: Omit<Product, 'id'>, clientId?: string) => {
    const user = await dataService.getCurrentUser();
    const targetClientId = clientId || product.client_id || user?.client_id;
    
    if (!targetClientId) {
      throw new Error('Debe seleccionar un cliente para registrar un producto');
    }
    
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addProduct({ ...product, client_id: targetClientId });
      } catch (error) {
        console.error('Error adding product to Supabase:', error);
      }
    }
    const products = await dataService.getProducts(targetClientId);
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9), client_id: targetClientId };
    dataService.saveProducts([...products, newProduct]);
    dataService.logAction('Producto Creado', `Se creó el producto ${product.name}`, targetClientId);
    return newProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>, clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updateProduct(id, updates);
      } catch (error) {
        console.error('Error updating product in Supabase:', error);
      }
    }
    const products = await dataService.getProducts(clientId);
    const product = products.find(p => p.id === id);
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    dataService.saveProducts(updated);
    dataService.logAction('Producto Actualizado', `Se actualizó el producto ${product?.name || id}`, clientId);
  },

  deleteProduct: async (id: string, clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.deleteProduct(id);
      } catch (error) {
        console.error('Error deleting product from Supabase:', error);
      }
    }
    const products = await dataService.getProducts(clientId);
    const product = products.find(p => p.id === id);
    dataService.saveProducts(products.filter(p => p.id !== id));
    dataService.logAction('Producto Eliminado', `Se eliminó el producto ${product?.name || id}`, clientId);
  },

  bulkUpdateStock: async (updates: { productId: string; quantityToAdd: number; newStock: number }[], clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.bulkUpdateStock(updates, clientId);
      } catch (error) {
        console.error('Error in bulk stock update in Supabase:', error);
        throw error;
      }
    }
    
    const products = await dataService.getProducts(clientId);
    const updatedProducts = products.map(p => {
      const update = updates.find(u => u.productId === p.id);
      if (update) {
        return { ...p, stock: update.newStock };
      }
      return p;
    });
    
    await dataService.saveProducts(updatedProducts);
    dataService.logAction('Stock Actualizado', `Se actualizó el stock de ${updates.length} productos`, clientId);
  },

  // Pitches CRUD
  addPitch: async (pitch: Omit<Pitch, 'id'>, clientId?: string) => {
    const user = await dataService.getCurrentUser();
    const targetClientId = clientId || pitch.client_id || user?.client_id;
    
    if (!targetClientId) {
      throw new Error('Debe seleccionar un cliente para registrar una cancha');
    }
    
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.addPitch({ ...pitch, client_id: targetClientId });
      } catch (error) {
        console.error('Error adding pitch to Supabase:', error);
      }
    }
    const pitches = await dataService.getPitches(targetClientId);
    const newPitch = { ...pitch, id: Math.random().toString(36).substr(2, 9), client_id: targetClientId };
    dataService.savePitches([...pitches, newPitch]);
    dataService.logAction('Cancha Creada', `Se creó la cancha ${pitch.name}`, targetClientId);
    return newPitch;
  },

  updatePitch: async (id: string, updates: Partial<Pitch>, clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.updatePitch(id, updates);
      } catch (error) {
        console.error('Error updating pitch in Supabase:', error);
      }
    }
    const pitches = await dataService.getPitches(clientId);
    const pitch = pitches.find(p => p.id === id);
    const updated = pitches.map(p => p.id === id ? { ...p, ...updates } : p);
    dataService.savePitches(updated);
    dataService.logAction('Cancha Actualizada', `Se actualizó la cancha ${pitch?.name || id}`, clientId);
  },

  deletePitch: async (id: string, clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.deletePitch(id);
      } catch (error) {
        console.error('Error deleting pitch from Supabase:', error);
      }
    }
    const pitches = await dataService.getPitches(clientId);
    const pitch = pitches.find(p => p.id === id);
    dataService.savePitches(pitches.filter(p => p.id !== id));
    dataService.logAction('Cancha Eliminada', `Se eliminó la cancha ${pitch?.name || id}`, clientId);
  }
};
