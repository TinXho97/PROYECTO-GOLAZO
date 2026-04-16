export type PitchType = 'F5' | 'F7' | 'F11';
export type BookingStatus = 'confirmed' | 'cancelled' | 'pending' | 'completed' | 'no_show';
export type UserRole = 'admin' | 'client' | 'superadmin';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: UserRole;
  password?: string;
  client_id?: string;
}

export interface Player {
  id: string;
  name: string;
  phone: string;
  client_id?: string;
  created_at?: Date;
}

export interface Pitch {
  id: string;
  name: string;
  type: PitchType;
  price: number;
  active: boolean;
  image_url?: string;
  client_id?: string;
}

export interface Booking {
  id: string;
  pitchId: string;
  userId: string;
  playerId?: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  createdAt: Date;
  receiptUrl?: string;
  depositAmount?: number;
  isPaid?: boolean;
  paymentUrl?: string;
  client_id?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'bebida' | 'comida' | 'otro';
  stock: number;
  min_stock: number;
  active: boolean;
  client_id?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: 'entrada' | 'salida' | 'ajuste';
  source: string;
  createdAt: Date;
  client_id?: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  totalPrice: number;
  date: Date;
  paymentMethod?: 'efectivo' | 'transferencia';
  items?: SaleItem[];
  client_id?: string;
  // Legacy fields for backward compatibility
  productId?: string;
  quantity?: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
  user: string;
  client_id?: string;
}

export interface Notification {
  id: string;
  type: 'booking' | 'stock';
  message: string;
  read: boolean;
  created_at: Date;
  client_id?: string;
}

export interface Client {
  id: string;
  name: string;
  complex_name?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'suspended';
  expires_at: string | null;
  enable_ranking: boolean;
  enable_sales: boolean;
  enable_reservations: boolean;
  enable_statistics?: boolean;
  ranking_reset_date?: string | null;
  created_at: string;
  features?: Record<string, boolean>;
}

export type PitchStatus = 'available' | 'busy' | 'reserved';
