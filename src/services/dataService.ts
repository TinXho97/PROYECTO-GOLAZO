import { Pitch, Booking, Product, Sale, User, UserRole, AuditLog, AuditLogFilters, AuditLogInput, BookingStatus, Client } from '../types';
import { addHours, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { supabaseService } from './supabaseService';
import { getPublicPortalClientById } from './publicPortalClients';

import { supabase, getSupabaseDiagnostics } from '../lib/supabase';


export interface PendingBookingData {
  pitchId: string;
  date: string;
  time: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  depositAmount: string;
  timestamp: number;
}

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

const PUBLIC_CLIENT_SELECTION_KEY = 'golazo_public_client_selection';

const getPublicClientSelection = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PUBLIC_CLIENT_SELECTION_KEY);
};

const setPublicClientSelection = (clientId: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PUBLIC_CLIENT_SELECTION_KEY, clientId);
};

const clearPublicClientSelection = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PUBLIC_CLIENT_SELECTION_KEY);
};

const requireClientId = (clientId: string | null | undefined, operation: string) => {
  if (!clientId) {
    throw new Error(`${operation}: client_id es obligatorio`);
  }

  return clientId;
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
  return diagnostics.hasUrl && diagnostics.hasKey;
};

const resolveAuditFilters = (filters?: string | AuditLogFilters) => {
  if (typeof filters === 'string') {
    return {
      clientId: filters,
      limit: 100,
    };
  }

  return {
    clientId: filters?.clientId,
    limit: filters?.limit ?? 100,
  };
};

const ensureAuditText = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const normalizeStoredAuditLog = (log: AuditLog): AuditLog => ({
  ...log,
  timestamp: new Date(log.timestamp),
  details: ensureAuditText(log.details, ensureAuditText(log.description)),
  description: ensureAuditText(log.description, ensureAuditText(log.details)),
  metadata: log.metadata && typeof log.metadata === 'object' ? log.metadata : null,
});

export const dataService = {
  isSupabaseConfigured,
  checkConnection: async () => {
    if (!isSupabaseConfigured()) return false;
    return await supabaseService.testConnection();
  },
  getPublicClientSelectionId: () => getPublicClientSelection(),
  setPublicClientSelection: (clientId: string) => {
    setPublicClientSelection(clientId);
  },
  clearPublicClientSelection: () => {
    clearPublicClientSelection();
  },
  savePendingBooking: (data: Omit<PendingBookingData, 'timestamp'>) => {
    const pendingData: PendingBookingData = {
      ...data,
      timestamp: Date.now()
    };
    sessionStorage.setItem('golazo_pending_booking', JSON.stringify(pendingData));
  },
  getPendingBooking: (): PendingBookingData | null => {
    const stored = sessionStorage.getItem('golazo_pending_booking');
    if (!stored) return null;
    try {
      const parsed: PendingBookingData = JSON.parse(stored);
      const MAX_AGE = 30 * 60 * 1000; // 30 minutos de vigencia
      if (Date.now() - parsed.timestamp > MAX_AGE) {
        sessionStorage.removeItem('golazo_pending_booking');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },
  clearPendingBooking: () => {
    sessionStorage.removeItem('golazo_pending_booking');
  },
  getPublicClients: async () => {
    if (isSupabaseConfigured()) {
      const clients = await supabaseService.getPublicClients();
      return clients as Client[];
    }

    const clients = getStorage<Client[]>('golazo_public_clients', []);
    const now = new Date();
    return clients.filter((client) => client.status === 'active' && (!client.expires_at || new Date(client.expires_at) >= now));
  },
  getPublicClientConfig: async (clientId?: string) => {
    if (!clientId) {
      return null;
    }

    if (isSupabaseConfigured()) {
      return await supabaseService.getPublicClientConfig(clientId);
    }

    const clients = getStorage<Client[]>('golazo_public_clients', []);
    return clients.find((client) => client.id === clientId) || null;
  },
  getClientConfig: async (clientId?: string) => {
    if (!clientId) {
      return null;
    }
    if (isSupabaseConfigured()) {
      const query = supabase
        .from('clients')
        .select('id, name, complex_name, status, created_at, expires_at, ranking_reset_date, phone, address, enable_ranking, enable_sales, enable_reservations, enable_statistics, features, settings')
        .eq('id', clientId);
      const { data, error } = await query.limit(1).single();
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }

        console.error('Error fetching client config, trying minimal fallback:', error);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('clients')
          .select('id, name, complex_name, status, created_at, expires_at, phone, address')
          .eq('id', clientId)
          .limit(1)
          .single();

        if (fallbackError) {
          if (fallbackError.code !== 'PGRST116') {
            console.error('Error fetching client config fallback:', fallbackError);
          }
          return getPublicPortalClientById(clientId);
        }

        return fallbackData as Client;
      }
      return data as Client;
    }
    return null;
  },
  updateClientSettings: async (clientId: string, settings: Record<string, unknown>) => {
    const targetClientId = requireClientId(clientId, 'Actualizar configuracion del cliente');

    if (isSupabaseConfigured()) {
      return await supabaseService.updateClientSettings(targetClientId, settings);
    }

    const clients = getStorage<Client[]>('golazo_public_clients', []);
    const updatedClients = clients.map((client) => {
      if (client.id !== targetClientId) return client;
      return {
        ...client,
        settings: {
          ...(client.settings || {}),
          ...settings,
        },
      };
    });
    setStorage('golazo_public_clients', updatedClients);
    return updatedClients.find((client) => client.id === targetClientId) || null;
  },
  // Pitches
  getPitches: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getPitches(clientId);
      } catch (error) {
        console.error('Error fetching pitches:', error);
        return [];
      }
    }
    return getStorage<Pitch[]>('golazo_pitches', MOCK_PITCHES)
      .filter((pitch) => pitch.active && (!clientId || pitch.client_id === clientId));
  },
  getPublicPitches: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getPublicPitches(clientId);
      } catch (error) {
        console.error('Error fetching public pitches:', error);
        return [];
      }
    }

    const pitches = getStorage<Pitch[]>('golazo_pitches', MOCK_PITCHES);
    return clientId ? pitches.filter((pitch) => pitch.client_id === clientId && pitch.active !== false) : pitches;
  },
  savePitches: async (pitches: Pitch[]) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }
  },
  createPublicBooking: async (payload: {
    client_slug: string;
    pitch_id: string;
    start_time: string;
    client_name: string;
    client_phone: string;
    notes?: string;
  }) => {
    if (isSupabaseConfigured()) {
      return await supabaseService.createPublicBooking(payload);
    }

    throw new Error('La reserva pública requiere Supabase configurado.');
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
        console.error('Error checking completed bookings:', error);
        return false;
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
        console.error('Error fetching bookings:', error);
        return [];
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
  saveBookings: async (bookings: Booking[]) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }
  },
  
  // Products
  getProducts: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getProducts(clientId);
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    }
    return getStorage<Product[]>('golazo_products', MOCK_PRODUCTS);
  },
  saveProducts: async (products: Product[]) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }
  },
  
  // Sales
  getSales: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getSales(clientId);
      } catch (error) {
        console.error('Error fetching sales:', error);
        return [];
      }
    }
    const sales = getStorage<Sale[]>('golazo_sales', []);
    return sales.map(s => ({
      ...s,
      totalPrice: typeof s.totalPrice === 'object' && s.totalPrice !== null ? Number((s.totalPrice as any).total) || 0 : Number(s.totalPrice) || 0,
    }));
  },
  saveSales: async (sales: Sale[]) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }
  },

  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) return null;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, client_id, full_name, phone')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Perfil no encontrado para el usuario autenticado:', profileError);
      return null;
    }

    if (!profile?.role) {
      console.error('No se pudo resolver el rol del usuario autenticado.');
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      phone: profile?.phone || session.user.phone || '',
      name: profile?.full_name || session.user.email || 'Usuario',
      role: profile.role,
      client_id: profile.client_id || undefined
    } as User;
  },
  login: async (identifier: string, password?: string, allowedRoles?: UserRole[]) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no esta configurado');
    }

    if (!identifier || !password) {
      throw new Error('Debes ingresar email y contrasena');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier.trim(),
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Correo o contrasena incorrectos');
    }

    const user = await dataService.getCurrentUser();
    if (!user) {
      await supabase.auth.signOut();
      throw new Error('El usuario autenticado no tiene perfil valido');
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      await supabase.auth.signOut();
      throw new Error('Este acceso no corresponde a este usuario');
    }

    return user;
  },
  logout: async () => {
    clearPublicClientSelection();
    if (!isSupabaseConfigured()) return;
    await supabase.auth.signOut();
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
  getAuditLogs: async (filters?: string | AuditLogFilters) => {
    const resolvedFilters = resolveAuditFilters(filters);
    if (!resolvedFilters.clientId) {
      throw new Error('Listar auditoria: client_id es obligatorio');
    }
    if (isSupabaseConfigured()) {
      try {
        return await supabaseService.getAuditLogs(resolvedFilters);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }
    }
    const logs = getStorage<AuditLog[]>('golazo_audit_logs', []);
    return logs
      .map(normalizeStoredAuditLog)
      .filter((log) => !resolvedFilters.clientId || log.client_id === resolvedFilters.clientId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, resolvedFilters.limit);
  },
  saveAuditLogs: async (logs: AuditLog[]) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }
  },
  logAction: async (entry: AuditLogInput) => {
    const user = await dataService.getCurrentUser();
    const targetClientId = entry.client_id || user?.client_id;
    
    if (!targetClientId) {
      console.warn('No client_id available for logAction. Skipping log.');
      return;
    }
    
    if (isSupabaseConfigured()) {
      try {
        await supabaseService.logAction({
          ...entry,
          client_id: targetClientId,
        });
      } catch (error) {
        console.error('Error logging action to Supabase:', error);
      }
    }
    const logs = await dataService.getAuditLogs({ clientId: targetClientId, limit: 500 });
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action: entry.action,
      entity: entry.entity || null,
      entity_id: entry.entity_id || null,
      user_id: user?.id || null,
      timestamp: new Date(),
      user: user?.name || 'Sistema',
      client_id: targetClientId,
      details: entry.details || entry.description,
      description: entry.description,
      metadata: entry.metadata || null,
    };
    dataService.saveAuditLogs([newLog, ...logs].slice(0, 500));
  },

  // Deactivated Slots
  getDeactivatedSlots: async (clientId?: string) => {
    if (isSupabaseConfigured()) {
      try {
        const slots = await supabaseService.getDeactivatedSlots(clientId);
        return new Set(slots.map(s => `${s.slot_date}-${s.slot_hour}-${s.pitch_id}`));
      } catch (error) {
        console.error('Error fetching deactivated slots:', error);
        return new Set<string>();
      }
    }
    return new Set<string>();
  },
  toggleDeactivatedSlot: async (pitchId: string, date: string, hour: number, clientId?: string) => {
    if (isSupabaseConfigured()) {
      await supabaseService.toggleDeactivatedSlot(pitchId, date, hour, clientId);
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

    let createdBooking!: Booking;
    
    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      createdBooking = await supabaseService.addBooking({ ...booking, client_id: targetClientId });
    } catch (error) {
      console.error('Error adding booking to Supabase:', error);
      throw error;
    }

    await dataService.logAction({
      action: 'Reserva creada',
      entity: 'booking',
      entity_id: createdBooking.id,
      client_id: targetClientId,
      description: `Se creo la reserva de ${createdBooking.clientName}`,
      metadata: {
        pitchId: createdBooking.pitchId,
        clientName: createdBooking.clientName,
        clientPhone: createdBooking.clientPhone,
        startTime: createdBooking.startTime.toISOString(),
        endTime: createdBooking.endTime.toISOString(),
        status: createdBooking.status,
        depositAmount: createdBooking.depositAmount || 0,
        isPaid: createdBooking.isPaid || false,
      },
    });

    return createdBooking;
  },

  cancelBooking: async (id: string, clientId?: string) => {
    const bookings = await dataService.getBookings(clientId);
    const booking = bookings.find(b => b.id === id);
    const targetClientId = requireClientId(clientId || booking?.client_id, 'Cancelar reserva');

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      await supabaseService.cancelBooking(id, targetClientId);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }

    if (booking && targetClientId) {
      await dataService.logAction({
        action: 'Reserva eliminada',
        entity: 'booking',
        entity_id: booking.id,
        client_id: targetClientId,
        description: `Se cancelo la reserva de ${booking.clientName}`,
        metadata: {
          previousStatus: booking.status,
          pitchId: booking.pitchId,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
        },
      });
    }
  },

  updateBookingStatus: async (id: string, status: BookingStatus, clientId?: string) => {
    const bookings = await dataService.getBookings(clientId);
    const booking = bookings.find(b => b.id === id);
    const targetClientId = requireClientId(clientId || booking?.client_id, 'Actualizar reserva');

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      await supabaseService.updateBookingStatus(id, status, targetClientId);
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }

    if (booking) {
      await dataService.logAction({
        action: 'Reserva actualizada',
        entity: 'booking',
        entity_id: booking.id,
        client_id: targetClientId,
        description: `Se actualizo el estado de la reserva de ${booking.clientName} a ${status}`,
        metadata: {
          previousStatus: booking.status,
          newStatus: status,
          pitchId: booking.pitchId,
        },
      });
    }
  },

  toggleBookingPayment: async (id: string, clientId?: string) => {
    const bookings = await dataService.getBookings(clientId);
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const targetClientId = requireClientId(clientId || booking.client_id, 'Actualizar pago de reserva');

    const nextIsPaid = !booking.isPaid;

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      await supabaseService.toggleBookingPayment(id, nextIsPaid, targetClientId);
    } catch (error) {
      console.error('Error toggling booking payment:', error);
      throw error;
    }

    await dataService.logAction({
      action: 'Reserva actualizada',
      entity: 'booking',
      entity_id: booking.id,
      client_id: targetClientId,
      description: `Se actualizo el pago de la reserva de ${booking.clientName}`,
      metadata: {
        previousIsPaid: booking.isPaid || false,
        newIsPaid: nextIsPaid,
        pitchId: booking.pitchId,
      },
    });
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

    let createdSale!: Sale;

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      createdSale = await supabaseService.addSale({
        productId,
        quantity,
        totalPrice: product.price * quantity,
        date: new Date(),
        paymentMethod,
        client_id: targetClientId
      });
    } catch (error) {
      console.error('Error adding sale to Supabase:', error);
      throw error;
    }

    await dataService.logAction({
      action: 'Venta realizada',
      entity: 'sale',
      entity_id: createdSale.id,
      client_id: targetClientId,
      description: `Se registro una venta de ${product.name}`,
      metadata: {
        productId,
        productName: product.name,
        quantity,
        paymentMethod: paymentMethod || null,
        totalPrice: createdSale.totalPrice,
      },
    });

    return createdSale;
  },

  deleteSale: async (id: string, clientId?: string) => {
    const sales = await dataService.getSales(clientId);
    const sale = sales.find(s => s.id === id);
    const targetClientId = clientId || sale?.client_id;

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      await supabaseService.deleteSale(id, targetClientId);
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }

    if (sale && targetClientId) {
      await dataService.logAction({
        action: 'Venta eliminada',
        entity: 'sale',
        entity_id: sale.id,
        client_id: targetClientId,
        description: 'Se elimino una venta registrada',
        metadata: {
          productId: sale.productId || null,
          quantity: getSaleQuantity(sale),
          totalPrice: sale.totalPrice,
          paymentMethod: sale.paymentMethod || null,
        },
      });
    }
  },

  // Products CRUD
  addProduct: async (product: Omit<Product, 'id'>, clientId?: string) => {
    const user = await dataService.getCurrentUser();
    const targetClientId = clientId || product.client_id || user?.client_id;
    
    if (!targetClientId) {
      throw new Error('Debe seleccionar un cliente para registrar un producto');
    }

    let createdProduct: Product | undefined;
    
    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      createdProduct = await supabaseService.addProduct({ ...product, client_id: targetClientId });
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }

    if (!createdProduct) {
      throw new Error('No se pudo crear el producto');
    }

    await dataService.logAction({
      action: 'Producto creado',
      entity: 'product',
      entity_id: createdProduct.id,
      client_id: targetClientId,
      description: `Se creo el producto ${createdProduct.name}`,
      metadata: {
        name: createdProduct.name,
        price: createdProduct.price,
        category: createdProduct.category,
        stock: createdProduct.stock,
        minStock: createdProduct.min_stock,
      },
    });

    return createdProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>, clientId?: string) => {
    const products = await dataService.getProducts(clientId);
    const product = products.find(p => p.id === id);
    const targetClientId = requireClientId(clientId || product?.client_id, 'Actualizar producto');

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      await supabaseService.updateProduct(id, updates, targetClientId);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    if (product) {
      await dataService.logAction({
        action: 'Producto actualizado',
        entity: 'product',
        entity_id: product.id,
        client_id: targetClientId,
        description: `Se actualizo el producto ${product.name}`,
        metadata: {
          before: {
            name: product.name,
            price: product.price,
            category: product.category,
            minStock: product.min_stock,
            active: product.active,
          },
          changes: updates,
        },
      });
    }
  },

  deleteProduct: async (id: string, clientId?: string) => {
    const products = await dataService.getProducts(clientId);
    const product = products.find(p => p.id === id);
    const targetClientId = requireClientId(clientId || product?.client_id, 'Eliminar producto');

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      await supabaseService.deleteProduct(id, targetClientId);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }

    if (product) {
      await dataService.logAction({
        action: 'Producto eliminado',
        entity: 'product',
        entity_id: product.id,
        client_id: targetClientId,
        description: `Se elimino el producto ${product.name}`,
        metadata: {
          name: product.name,
          category: product.category,
          stock: product.stock,
          price: product.price,
        },
      });
    }
  },

  bulkUpdateStock: async (updates: { productId: string; quantityToAdd: number; newStock: number }[], clientId?: string) => {
    const products = await dataService.getProducts(clientId);
    const targetClientId = requireClientId(
      clientId || products.find((product) => updates.some((update) => update.productId === product.id))?.client_id,
      'Actualizar stock',
    );

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      await supabaseService.bulkUpdateStock(updates, targetClientId);
    } catch (error) {
      console.error('Error in bulk stock update:', error);
      throw error;
    }

    await dataService.logAction({
      action: 'Stock actualizado',
      entity: 'inventory',
      entity_id: updates.length === 1 ? updates[0].productId : undefined,
      client_id: targetClientId,
      description: `Se actualizaron los stocks de ${updates.length} producto(s)`,
      metadata: {
        updates: updates.map((update) => {
          const product = products.find((item) => item.id === update.productId);
          return {
            productId: update.productId,
            productName: product?.name || null,
            previousStock: product?.stock ?? null,
            quantityToAdd: update.quantityToAdd,
            newStock: update.newStock,
          };
        }),
      },
    });
  },

  // Pitches CRUD
  addPitch: async (pitch: Omit<Pitch, 'id'>, clientId?: string) => {
    const user = await dataService.getCurrentUser();
    const targetClientId = clientId || pitch.client_id || user?.client_id;
    
    if (!targetClientId) {
      throw new Error('Debe seleccionar un cliente para registrar una cancha');
    }

    let createdPitch: Pitch | undefined;
    
    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      createdPitch = await supabaseService.addPitch({ ...pitch, client_id: targetClientId });
    } catch (error) {
      console.error('Error adding pitch:', error);
      throw error;
    }

    if (!createdPitch) {
      throw new Error('No se pudo crear la cancha');
    }

    await dataService.logAction({
      action: 'Cancha creada',
      entity: 'pitch',
      entity_id: createdPitch.id,
      client_id: targetClientId,
      description: `Se creo la cancha ${createdPitch.name}`,
      metadata: {
        name: createdPitch.name,
        type: createdPitch.type,
        price: createdPitch.price,
        active: createdPitch.active,
      },
    });

    return createdPitch;
  },

  updatePitch: async (id: string, updates: Partial<Pitch>, clientId?: string) => {
    const pitches = await dataService.getPitches(clientId);
    const pitch = pitches.find(p => p.id === id);
    const targetClientId = requireClientId(clientId || pitch?.client_id, 'Actualizar cancha');

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      await supabaseService.updatePitch(id, updates, targetClientId);
    } catch (error) {
      console.error('Error updating pitch:', error);
      throw error;
    }

    if (pitch) {
      await dataService.logAction({
        action: 'Cancha actualizada',
        entity: 'pitch',
        entity_id: pitch.id,
        client_id: targetClientId,
        description: `Se actualizo la cancha ${pitch.name}`,
        metadata: {
          before: {
            name: pitch.name,
            type: pitch.type,
            price: pitch.price,
            active: pitch.active,
          },
          changes: updates,
        },
      });
    }
  },

  deletePitch: async (id: string, clientId?: string) => {
    const pitches = await dataService.getPitches(clientId);
    const pitch = pitches.find(p => p.id === id);
    const targetClientId = requireClientId(clientId || pitch?.client_id, 'Eliminar cancha');

    if (!isSupabaseConfigured()) {
      throw new Error('Operación denegada: Sin conexión a Supabase.');
    }

    try {
      await supabaseService.deletePitch(id, targetClientId);
    } catch (error) {
      console.error('Error deleting pitch:', error);
      throw error;
    }

    if (pitch) {
      await dataService.logAction({
        action: 'Cancha eliminada',
        entity: 'pitch',
        entity_id: pitch.id,
        client_id: targetClientId,
        description: `Se elimino la cancha ${pitch.name}`,
        metadata: {
          name: pitch.name,
          type: pitch.type,
          price: pitch.price,
          active: pitch.active,
        },
      });
    }
  }
};
