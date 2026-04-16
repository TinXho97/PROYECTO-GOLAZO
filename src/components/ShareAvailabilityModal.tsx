import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Pitch, Booking } from '../types';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Share2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  pitch: Pitch | null;
  pitches?: Pitch[];
  onPitchChange?: (pitchId: string) => void;
  bookings: Booking[];
  selectedDate: Date;
}

export function ShareAvailabilityModal({ isOpen, onClose, pitch, pitches, onPitchChange, bookings, selectedDate }: ShareAvailabilityModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && pitch) {
      generateImage();
    }
  }, [isOpen, pitch, selectedDate, bookings]);

  const getAvailableHours = () => {
    if (!pitch) return [];
    const hours = Array.from({ length: 15 }, (_, i) => (i + 10) % 24); // 10:00 to 01:00
    const currentTime = new Date();

    return hours.filter(hour => {
      const slotDate = new Date(selectedDate);
      slotDate.setHours(hour, 0, 0, 0);
      
      if (slotDate < currentTime) return false;

      const isOccupied = bookings.some(b => 
        b.pitchId === pitch.id && 
        isSameDay(b.startTime, selectedDate) && 
        b.startTime.getHours() === hour &&
        (b.status === 'confirmed' || b.status === 'pending' || b.status === 'completed')
      );

      return !isOccupied;
    });
  };

  const generateImage = async () => {
    if (!pitch || !canvasRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas size
      canvas.width = 1080;
      canvas.height = 1080;

      // Draw background image
      if (pitch.image_url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = pitch.image_url!;
        });
        
        // Cover logic
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      } else {
        // Fallback gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0ea5e9');
        gradient.addColorStop(1, '#0284c7');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Dark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Header
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      // Date
      ctx.font = 'bold 48px Inter, sans-serif';
      const dateStr = format(selectedDate, "EEEE d 'de' MMMM", { locale: es }).toUpperCase();
      ctx.fillText(dateStr, canvas.width / 2, 160);

      // Title
      ctx.font = '900 80px Inter, sans-serif';
      ctx.fillText('HORARIOS DISPONIBLES', canvas.width / 2, 260);

      // Pitch Name
      ctx.font = '600 40px Inter, sans-serif';
      ctx.fillStyle = '#38bdf8'; // sky-400
      ctx.fillText(pitch.name.toUpperCase(), canvas.width / 2, 330);

      // Draw Available Slots
      const availableHours = getAvailableHours();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Inter, sans-serif';
      
      if (availableHours.length === 0) {
        ctx.fillText('NO HAY TURNOS DISPONIBLES', canvas.width / 2, canvas.height / 2 + 50);
      } else {
        // Grid layout for hours
        const cols = availableHours.length > 8 ? 2 : 1;
        const startY = 450;
        const lineHeight = 80;
        
        availableHours.forEach((hour, index) => {
          const col = cols === 2 ? index % 2 : 0;
          const row = cols === 2 ? Math.floor(index / 2) : index;
          
          const x = cols === 2 
            ? (col === 0 ? canvas.width / 2 - 150 : canvas.width / 2 + 150)
            : canvas.width / 2;
            
          const y = startY + (row * lineHeight);
          
          const timeStr = `${hour.toString().padStart(2, '0')}:00`;
          ctx.fillText(`⚽ ${timeStr}`, x, y);
        });
      }

      // Footer
      ctx.font = '500 32px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.fillText('Reserva online en golazo.app', canvas.width / 2, canvas.height - 80);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Error al generar la imagen');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `disponibilidad-${pitch?.name.replace(/\s+/g, '-').toLowerCase()}-${format(selectedDate, 'yyyy-MM-dd')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Imagen descargada');
  };

  const handleShareWhatsApp = async () => {
    if (!previewUrl) return;
    
    try {
      // Convert base64 to blob
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const file = new File([blob], 'disponibilidad.jpg', { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Horarios Disponibles',
          text: `¡Mirá los horarios disponibles para ${pitch?.name}! ⚽`,
        });
      } else {
        // Fallback if Web Share API is not supported
        toast.error('Tu navegador no soporta compartir imágenes directamente. Por favor, descarga la imagen.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareLink = () => {
    if (!pitch) return;
    const url = `https://golazo.app/reservar/${pitch.id}`;
    const text = encodeURIComponent(`Reservá tu turno acá ⚽ ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (!pitch) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compartir Disponibilidad">
      <div className="space-y-6">
        {pitches && pitches.length > 0 && onPitchChange && (
          <div>
            <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">
              Seleccionar Cancha
            </label>
            <select
              className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-200 font-bold text-sm outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              value={pitch?.id || ''}
              onChange={(e) => onPitchChange(e.target.value)}
            >
              <option value="" disabled>Seleccione una cancha...</option>
              {pitches.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col items-center justify-center bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-sky-500" />
              <p className="text-sm font-bold uppercase tracking-widest">Generando imagen...</p>
            </div>
          ) : previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full max-w-sm rounded-xl shadow-lg border border-zinc-200" />
          ) : null}
          
          {/* Hidden canvas for generation */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            onClick={handleDownload} 
            disabled={isGenerating || !previewUrl}
            className="w-full gap-2 py-4 shadow-lg shadow-sky-500/20 font-black tracking-tight"
          >
            <Download className="w-4 h-4" />
            DESCARGAR IMAGEN
          </Button>
          
          <Button 
            onClick={handleShareWhatsApp} 
            disabled={isGenerating || !previewUrl}
            variant="outline"
            className="w-full gap-2 py-4 border-zinc-200 font-black tracking-tight"
          >
            <Share2 className="w-4 h-4" />
            COMPARTIR IMAGEN
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-zinc-500 font-black tracking-widest">O</span>
          </div>
        </div>

        <Button 
          onClick={handleShareLink} 
          variant="secondary"
          className="w-full gap-2 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black tracking-tight shadow-lg shadow-[#25D366]/20"
        >
          <LinkIcon className="w-4 h-4" />
          COMPARTIR LINK DE RESERVA
        </Button>
      </div>
    </Modal>
  );
}
