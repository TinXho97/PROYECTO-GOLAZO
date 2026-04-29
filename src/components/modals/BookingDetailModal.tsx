import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Phone, MapPin, DollarSign, CheckCircle2, AlertCircle, Zap, Clock, Calendar as CalendarIcon, FileText, Download, Maximize2 } from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Booking, Pitch, User as UserType } from '../../types';
import { cn } from '../../lib/utils';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  pitches: Pitch[];
  user: UserType;
  onTogglePayment: () => void;
  onCancelClick: () => void;
  onViewReceipt: (url: string) => void;
}

export function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  pitches,
  user,
  onTogglePayment,
  onCancelClick,
  onViewReceipt
}: BookingDetailModalProps) {
  if (!booking) return null;

  const now = new Date();
  const isPlaying = now >= booking.startTime && now <= booking.endTime;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles de la Reserva">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-zinc-900">{booking.clientName}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-none">Confirmada</Badge>
              {booking.isPaid ? (
                <Badge variant="success" className="bg-blue-100 text-blue-700 border-none flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Pagado
                </Badge>
              ) : (
                <Badge variant="neutral" className="bg-amber-100 text-amber-700 border-none flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Pendiente
                </Badge>
              )}
            </div>
          </div>
        </div>

        {isPlaying && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-600 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">¡Partido en Juego!</p>
              <p className="text-xs text-amber-700">El partido se está jugando ahora. Asegúrate de cobrar el saldo pendiente.</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Horario
            </p>
            <p className="text-sm font-bold text-zinc-900">
              {format(booking.startTime, 'HH:mm')} - {format(booking.endTime, 'HH:mm')} hs
            </p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" /> Fecha
            </p>
            <p className="text-sm font-bold text-zinc-900">
              {format(booking.startTime, "d 'de' MMM", { locale: es })}
            </p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3" /> Teléfono
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-900">{booking.clientPhone}</p>
              <Button 
                size="sm" 
                variant="outline"
                className="h-6 px-2 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 rounded-lg"
                onClick={() => window.open(`https://wa.me/${booking.clientPhone.replace(/\D/g, '')}`, '_blank')}
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </Button>
            </div>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Cancha
            </p>
            <p className="text-sm font-bold text-zinc-900">
              {pitches.find(p => p.id === booking.pitchId)?.name}
            </p>
          </div>
        </div>

        {booking.depositAmount && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-bold text-zinc-700">Seña abonada</span>
            </div>
            <span className="text-lg font-bold text-primary">${booking.depositAmount}</span>
          </div>
        )}

        {booking.paymentUrl && (
          <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
              </div>
              <span className="text-sm font-bold text-zinc-700">Ref. Mercado Pago</span>
            </div>
            <span className="text-sm font-bold text-sky-600">{booking.paymentUrl}</span>
          </div>
        )}

        {booking.receiptUrl && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Comprobante</p>
            <div className="relative group aspect-video rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center">
              {booking.receiptUrl.startsWith('data:application/pdf') ? (
                <div className="flex flex-col items-center gap-2 p-4 text-center">
                  <FileText className="w-8 h-8 text-red-500" />
                  <p className="text-xs font-bold text-zinc-900">Archivo PDF</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 text-[10px]"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = booking.receiptUrl!;
                      link.download = `comprobante-${booking.clientName}.pdf`;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
              ) : (
                <>
                  <img 
                    src={booking.receiptUrl} 
                    alt="Comprobante" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 text-[10px]"
                      onClick={() => onViewReceipt(booking.receiptUrl!)}
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Ver Completo
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="pt-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <Button 
                variant={booking.isPaid ? "outline" : "primary"}
                className={cn(
                  "flex-1 font-bold",
                  booking.isPaid ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                onClick={onTogglePayment}
              >
                {booking.isPaid ? 'Marcar como Pendiente' : 'Marcar como Pagado'}
              </Button>
              <Button className="flex-1 font-bold">Editar</Button>
            </div>
            <Button 
              variant="ghost" 
              className="w-full text-red-500 hover:bg-red-50 font-bold"
              onClick={onCancelClick}
            >
              Cancelar Reserva
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}