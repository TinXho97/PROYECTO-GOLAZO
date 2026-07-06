import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  X, 
  Send, 
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { processMessage } from '../bot';

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
        { label: 'Reservar cancha', value: 'reservar' },
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
      setChatMessages(prev => [...prev, { role: 'bot', text: "Hubo un error al procesar tu solicitud. Por favor, intentá de nuevo." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
        className={cn(
          "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all",
          isOpen
            ? "border-slate-200 bg-white text-[#081A33] shadow-[0_16px_34px_rgba(8,26,51,0.16)]"
            : "border-white/15 bg-[#081A33] text-white shadow-[0_16px_34px_rgba(8,26,51,0.22)] hover:bg-[#0F2747]"
        )}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-4 right-4 z-50 flex h-[min(78dvh,560px)] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(8,26,51,0.18)] sm:left-auto sm:right-5 sm:w-[360px]"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-[#081A33] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                    <User className="h-5 w-5 text-sky-200" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#081A33] bg-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none">LIO</h3>
                  <p className="mt-1 text-[10px] font-semibold text-emerald-200">En línea ahora</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar asistente"
                className="rounded-xl p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
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
                  <span className="mt-1.5 px-1 text-[9px] font-semibold text-zinc-400">
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
                    placeholder="Escribí tu mensaje..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-zinc-900 placeholder:text-zinc-400"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isTyping}
                    aria-label="Enviar mensaje"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
              <p className="mt-3 text-center text-[9px] font-medium text-zinc-400">
                Desarrollado por Golazo AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
