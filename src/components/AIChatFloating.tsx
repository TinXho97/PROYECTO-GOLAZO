import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  X, 
  Send, 
  MessageSquare,
  ChevronDown,
  Settings,
  DollarSign,
  Info,
  Coffee,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService, api } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { processMessage } from '../bot';
import { BotResponse } from '../bot/responses';

interface Message {
  role: 'user' | 'bot';
  text: string;
  options?: { label: string; value: string }[];
}

export default function AIChatFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      text: '¡Hola! Soy el asistente virtual de reservas. ¿En qué te puedo ayudar hoy?',
      options: [
        { label: 'Reservar Cancha', value: 'reservar' },
        { label: 'Ayuda', value: 'ayuda' }
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Fake user id for the bot session
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, textValue?: string) => {
    if (e) e.preventDefault();
    const userMsg = textValue || chatInput;
    if (!userMsg.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Get client info from localStorage or use defaults
      const clientName = localStorage.getItem('golazo_guest_name') || 'Cliente';
      const clientPhone = localStorage.getItem('golazo_guest_phone') || '0000000000';
      
      const response = await processMessage(sessionId, userMsg, clientName, clientPhone);
      
      setChatMessages(prev => [...prev, { 
        role: 'bot', 
        text: response.text,
        options: response.options
      }]);
    } catch (error) {
      console.error("Bot Error:", error);
      setChatMessages(prev => [...prev, { role: 'bot', text: "Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button (The "Gauchito Mascot") */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 right-8 w-20 h-20 rounded-full flex items-center justify-center z-50 transition-all group",
          isOpen 
            ? "bg-white text-zinc-900 shadow-2xl border border-zinc-200" 
            : "bg-transparent"
        )}
      >
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* The "Pelota Gauchita" Mascot */}
            <div className="relative w-16 h-16 bg-sky-400 rounded-full border-4 border-zinc-900 shadow-xl flex items-center justify-center overflow-visible">
              {/* Soccer Ball Pattern (Emoji Style ⚽) */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                {/* Central Pentagon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-900" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                
                {/* Lines connecting pentagons */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-0" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-[72deg]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-[144deg]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-[216deg]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-900/40 rotate-[288deg]" />

                {/* Surrounding partial pentagons */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-zinc-900" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                <div className="absolute top-2 -left-2 w-5 h-5 bg-zinc-900 rotate-[-45deg]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                <div className="absolute top-2 -right-2 w-5 h-5 bg-zinc-900 rotate-[45deg]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                <div className="absolute -bottom-2 left-2 w-5 h-5 bg-zinc-900 rotate-[180deg]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                <div className="absolute -bottom-2 right-2 w-5 h-5 bg-zinc-900 rotate-[180deg]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
              </div>

              {/* Eyes */}
              <div className="relative z-20 flex gap-3 mt-1">
                <div className="w-3 h-3 bg-zinc-900 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full -mt-1 -ml-1" />
                </div>
                <div className="w-3 h-3 bg-zinc-900 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full -mt-1 -ml-1" />
                </div>
              </div>

              {/* Smile */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-3 border-b-2 border-zinc-900 rounded-full" />
            </div>
            
            {/* Notification Badge */}
            <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg z-50">
              <span className="text-[8px] font-black text-zinc-900">!</span>
            </div>
          </div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 right-0 w-full h-[100dvh] sm:bottom-28 sm:right-8 sm:w-[400px] sm:h-[600px] sm:max-h-[700px] bg-white sm:rounded-[32px] shadow-2xl z-[60] overflow-hidden border-t sm:border border-zinc-200 flex flex-col"
          >
            {/* Header - SaaS Premium Style */}
            <div className="px-6 py-5 bg-white border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
                    <User className="w-6 h-6 text-sky-500" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm leading-none">LIO</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">En línea ahora</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-zinc-50 rounded-xl transition-colors text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 scroll-smooth">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 text-sm font-medium leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-sky-600 text-white rounded-2xl rounded-tr-none" 
                      : "bg-white text-zinc-700 rounded-2xl rounded-tl-none border border-zinc-100"
                  )}>
                    {msg.text}
                  </div>
                  {msg.options && msg.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(undefined, opt.value)}
                          className="text-xs font-bold bg-white border border-sky-200 text-sky-600 px-3 py-1.5 rounded-xl hover:bg-sky-50 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mt-1.5 px-1">
                    {msg.role === 'user' ? 'Tú' : 'Lio'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex flex-col items-start max-w-[80%] mr-auto">
                  <div className="bg-white border border-zinc-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-zinc-100">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="Escribe tu mensaje..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-zinc-900 placeholder:text-zinc-400"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
              <p className="text-[9px] text-center text-zinc-400 font-medium mt-3 uppercase tracking-widest">
                Desarrollado por Golazo AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
