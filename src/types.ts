export type PitchType = 'F5' | 'F7' | 'F11';
export type BookingStatus = 'confirmed' | 'cancelled' | 'pending';
export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Pitch {
  id: string;
  name: string;
  type: PitchType;
  price: number;
  active: boolean;
}

export interface Booking {
  id: string;
  pitchId: string;
  userId: string;
  clientName: string;
  clientPhone: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'bebida' | 'comida' | 'otro';
}

export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  date: Date;
}

export type PitchStatus = 'available' | 'busy' | 'reserved';
