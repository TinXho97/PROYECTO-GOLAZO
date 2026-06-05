import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Package, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { dataService } from '../services/dataService';
import { Notification, User } from '../types';
import { cn } from '../lib/utils';
import { getEffectiveClientId } from '../lib/tenant';

interface NotificationsPanelProps {
  onNotificationClick?: (bookingId: string) => void;
}

export function NotificationsPanel({ onNotificationClick }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    dataService.getCurrentUser().then(setUser);
  }, []);

  const playNotificationSound = async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        await context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.12);

      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.25);
    } catch {
      // Browsers can block audio until the user interacts with the page.
    }
  };

  useEffect(() => {
    return () => {
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

  const clientId = getEffectiveClientId(user);
  const readNotificationsKey = clientId ? `golazo_read_notifications:${clientId}` : null;

  useEffect(() => {
    if (!dataService.isSupabaseConfigured()) return;

    // Si no hay clientId, no creamos ninguna suscripción para evitar fugas de datos
    if (!clientId) return;

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel(`public:notifications:${clientId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `client_id=eq.${clientId}`
      }, payload => {
        playNotificationSound();
        setIsHighlight(true);
        setTimeout(() => setIsHighlight(false), 2000);

        const newNotification = {
          id: payload.new.id,
          type: payload.new.type,
          message: payload.new.message,
          read: payload.new.read,
          created_at: new Date(payload.new.created_at)
        } as Notification;
        
        setNotifications(prev => [newNotification, ...prev]);
      })
      .subscribe();

    // Subscribe to new bookings for realtime alerts
    const bookingsSubscription = supabase
      .channel(`public:bookings:${clientId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bookings',
        filter: `client_id=eq.${clientId}`
      }, async payload => {
        playNotificationSound();
        
        // Highlight bell
        setIsHighlight(true);
        setTimeout(() => setIsHighlight(false), 2000);

        // Fetch pitch name for the toast
        try {
          const { data: pitch } = await supabase
            .from('pitches')
            .select('name')
            .eq('id', payload.new.pitch_id)
            .eq('client_id', clientId)
            .single();
          const pitchName = pitch?.name || 'Cancha';
          
          // Parse the start_time properly
          const startTime = new Date(payload.new.start_time);
          
          // Format time manually to avoid timezone issues with toLocaleTimeString if needed, 
          // but toLocaleTimeString is fine for local display
          const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          toast.success(`Nueva reserva - ${pitchName} a las ${timeStr}`, {
            duration: 5000,
          });

          // Add to notifications list in memory (in case the insert to notifications table failed due to RLS)
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'booking',
            message: `Nueva reserva de ${payload.new.client_name} - ${pitchName} a las ${timeStr}`,
            read: false,
            created_at: new Date(payload.new.created_at)
          };
          setNotifications(prev => [newNotification, ...prev]);

        } catch {
          toast.success(`Nueva reserva recibida`, {
            duration: 5000,
          });
          
          // Add generic notification
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'booking',
            message: `Nueva reserva de ${payload.new.client_name}`,
            read: false,
            created_at: new Date(payload.new.created_at)
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(bookingsSubscription);
    };
  }, [clientId]);

  const fetchNotifications = async () => {
    if (!dataService.isSupabaseConfigured()) return;
    try {
      // Fetch from notifications table
      const data = await supabaseService.getNotifications(clientId);
      
      // Also fetch recent bookings to ensure we don't miss any if the notifications table insert failed due to RLS
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('*, pitches(name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      const readIds = readNotificationsKey
        ? JSON.parse(localStorage.getItem(readNotificationsKey) || '[]')
        : [];
      
      const bookingNotifications = (recentBookings || [])
        .map(b => {
          const pitchName = b.pitches?.name || 'Cancha';
          const startTime = new Date(b.start_time);
          const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const depositText = b.deposit_amount ? ` (Seña: $${b.deposit_amount})` : '';
          
          return {
            id: b.id,
            type: 'booking',
            message: `Nueva reserva de ${b.client_name} - ${pitchName} a las ${timeStr}${depositText}|${b.id}`,
            read: readIds.includes(b.id),
            created_at: new Date(b.created_at)
          } as Notification;
        });

      // Merge and deduplicate by ID
      const allNotifications = [...data, ...bookingNotifications];
      const uniqueNotifications = Array.from(new Map(allNotifications.map(item => [item.id, item])).values());
      
      // Sort by date descending
      uniqueNotifications.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      
      setNotifications(uniqueNotifications);
    } catch {
      setNotifications([]);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabaseService.markNotificationAsRead(id, clientId).catch(() => {});
      
      // Always mark in localStorage for bookings
      const readIds = readNotificationsKey
        ? JSON.parse(localStorage.getItem(readNotificationsKey) || '[]')
        : [];
      if (readNotificationsKey && !readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem(readNotificationsKey, JSON.stringify(readIds));
      }
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabaseService.markAllNotificationsAsRead(clientId).catch(() => {});
      
      const readIds = readNotificationsKey
        ? JSON.parse(localStorage.getItem(readNotificationsKey) || '[]')
        : [];
      notifications.forEach(n => {
        if (!readIds.includes(n.id)) readIds.push(n.id);
      });
      if (readNotificationsKey) {
        localStorage.setItem(readNotificationsKey, JSON.stringify(readIds));
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 transition-all rounded-full",
          isHighlight ? "bg-sky-100 text-sky-600 scale-110" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
        )}
      >
        <Bell className={cn("w-6 h-6", isHighlight && "animate-bounce")} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[24px] shadow-xl border border-zinc-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <h3 className="font-black text-zinc-900 uppercase tracking-widest text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-500" />
                  Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-700 uppercase tracking-widest"
                  >
                    Marcar todas leídas
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {notifications.map(notification => {
                      const parts = notification.message.split('|');
                      const displayMessage = parts[0];
                      const bookingId = parts.length > 1 ? parts[1] : null;

                      return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 transition-colors hover:bg-zinc-50 flex gap-3",
                          !notification.read ? "bg-sky-50/30" : "",
                          bookingId && onNotificationClick ? "cursor-pointer" : ""
                        )}
                        onClick={() => {
                          if (bookingId && onNotificationClick) {
                            onNotificationClick(bookingId);
                            setIsOpen(false);
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                          }
                        }}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          notification.type === 'booking' ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                        )}>
                          {notification.type === 'booking' ? <Calendar className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm",
                            !notification.read ? "font-bold text-zinc-900" : "font-medium text-zinc-600"
                          )}>
                            {displayMessage}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                            {formatDistanceToNow(notification.created_at, { addSuffix: true, locale: es })}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="w-6 h-6 rounded-full hover:bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 transition-colors"
                            title="Marcar como leída"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
