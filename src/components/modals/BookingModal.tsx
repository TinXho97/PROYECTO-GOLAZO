import React from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, DollarSign, CheckCircle2, Download, Zap, Timer, Banknote, Clock } from 'lucide-react';
import { Pitch } from '../../types';
import { cn } from '../../lib/utils';

export interface BookingFormData {
  pitch: Pitch | null;
  date: Date;
  time: string;
  clientName: string;
  clientPhone: string;
  receipt: string | null;
  depositAmount: string;
  paymentMethod: 'transferencia' | 'mercadopago';
  paymentUrl: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  bookingData: BookingFormData;
  setBookingData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  bookingTimer: number | null;
  isPromoHour: (hour: number) => boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BookingModal({
  isOpen,
  onClose,
  onSubmit,
  bookingData,
  setBookingData,
  bookingTimer,
  isPromoHour,
  handleFileChange
}: BookingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Reserva">
      {bookingTimer !== null && (
        <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-2xl border border-red-100 mb-6 animate-pulse">
          <Timer className="w-5 h-5" />
          <span className="font-black tracking-widest uppercase text-xs">
            Tiempo restante: {Math.floor(bookingTimer / 60)}:{(bookingTimer % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Detalles del turno</p>
            <h3 className="text-base font-bold text-zinc-900">
              {bookingData.pitch?.name} • {bookingData.time} hs
            </h3>
            <p className="text-xs text-zinc-500">{format(bookingData.date, "EEEE d 'de' MMMM", { locale: es })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-700 ml-1">Horario del Turno (Asignado automáticamente)</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input 
                type="text" 
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-black cursor-not-allowed select-none focus:outline-none"
                value={`${format(bookingData.date, "dd/MM/yyyy")} - ${bookingData.time} hs`}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 ml-1">Nombre del Cliente</label>
            <input 
              type="text" 
              required
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
              value={bookingData.clientName}
              onChange={e => setBookingData(prev => ({ ...prev, clientName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 ml-1">Teléfono</label>
            <input 
              type="tel" 
              required
              placeholder="Ej: 11 2345 6789"
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
              value={bookingData.clientPhone}
              onChange={e => setBookingData(prev => ({ ...prev, clientPhone: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 ml-1">Método de pago de seña</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBookingData({ ...bookingData, paymentMethod: 'transferencia' })}
              className={cn(
                "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                bookingData.paymentMethod === 'transferencia' 
                  ? "bg-sky-50 text-sky-600 border-sky-200" 
                  : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
              )}
            >
              Transferencia
            </button>
            <button
              type="button"
              onClick={() => setBookingData({ ...bookingData, paymentMethod: 'mercadopago' })}
              className={cn(
                "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                bookingData.paymentMethod === 'mercadopago' 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                  : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
              )}
            >
              Efectivo
            </button>
          </div>
        </div>

        {bookingData.paymentMethod === 'transferencia' ? (
          <div className="space-y-3">
            <div className="bg-sky-50/50 p-3 rounded-2xl border border-sky-100 space-y-2">
              <p className="text-xs font-bold text-sky-800">Datos Bancarios</p>
              <div className="text-[11px] text-sky-700 space-y-1">
                <p><span className="font-semibold">Banco:</span> Banco Nación</p>
                <p><span className="font-semibold">Titular:</span> Complejo Golazo</p>
                <p><span className="font-semibold">CBU:</span> 1234567890123456789012</p>
                <p><span className="font-semibold">Alias:</span> GOLAZO.CANCHA</p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 ml-1">Comprobante de Seña (Mín. $500)</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <label 
                  htmlFor="receipt-upload"
                  className={cn(
                    "w-full px-4 py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all",
                    bookingData.receipt ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {bookingData.receipt ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <p className="text-[10px] font-bold text-emerald-600">¡Comprobante Cargado!</p>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-zinc-900">Subir Comprobante</p>
                        <p className="text-[9px] text-zinc-500">Imagen o PDF (Máx 2MB)</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-emerald-800">
              El pago se realiza en la cancha antes del turno
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 ml-1">Monto de la Seña ($)</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="number" 
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
              value={bookingData.depositAmount}
              onChange={e => setBookingData(prev => ({ ...prev, depositAmount: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="w-4 h-4 fill-primary" />
            <span className="text-xs font-bold">+{isPromoHour(parseInt(bookingData.time)) ? '1.5' : '1'} Puntos</span>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="px-8 shadow-lg shadow-primary/20">
              Confirmar Reserva
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}