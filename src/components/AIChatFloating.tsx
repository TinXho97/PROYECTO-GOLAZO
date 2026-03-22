import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  MessageSquare,
  ChevronDown,
  Settings,
  DollarSign,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { dataService, api } from '../services/dataService';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

export default function AIChatFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'bot', text: '¡Hola! Soy tu asistente IA. Puedo ayudarte con estadísticas, responder dudas o incluso cambiar los precios de las canchas y bebidas si me lo pides.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const updatePitchPrice: FunctionDeclaration = {
    name: "updatePitchPrice",
    parameters: {
      type: Type.OBJECT,
      description: "Actualiza el precio de una cancha de fútbol.",
      properties: {
        pitchId: {
          type: Type.STRING,
          description: "El ID de la cancha (ej: p1, p2, p3).",
        },
        newPrice: {
          type: Type.NUMBER,
          description: "El nuevo precio para la cancha.",
        },
      },
      required: ["pitchId", "newPrice"],
    },
  };

  const updateProductPrice: FunctionDeclaration = {
    name: "updateProductPrice",
    parameters: {
      type: Type.OBJECT,
      description: "Actualiza el precio de un producto del bar (bebida).",
      properties: {
        productId: {
          type: Type.STRING,
          description: "El ID del producto (ej: pr1, pr2).",
        },
        newPrice: {
          type: Type.NUMBER,
          description: "El nuevo precio para el producto.",
        },
      },
      required: ["productId", "newPrice"],
    },
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const pitches = dataService.getPitches();
      const products = dataService.getProducts();

      const systemInstruction = `
        Eres un asistente experto para dueños de complejos de fútbol 5 llamados "El Golazo".
        
        Tus capacidades:
        1. Responder dudas sobre el negocio y estadísticas.
        2. Cambiar precios de canchas usando la herramienta 'updatePitchPrice'.
        3. Cambiar precios de bebidas usando la herramienta 'updateProductPrice'.
        
        Limitaciones IMPORTANTES:
        - NO puedes cambiar nada de la interfaz (UI), diseño o código de la página. Explica que eso solo lo pueden hacer los programadores.
        - Solo puedes cambiar precios de canchas y productos.
        
        Contexto actual:
        - Canchas disponibles: ${JSON.stringify(pitches)}
        - Productos disponibles: ${JSON.stringify(products)}
        
        Responde de forma profesional, concisa y amable en español.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: { 
          systemInstruction,
          tools: [{ functionDeclarations: [updatePitchPrice, updateProductPrice] }]
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === "updatePitchPrice") {
            const { pitchId, newPrice } = call.args as { pitchId: string, newPrice: number };
            await api.updatePitch(pitchId, { price: newPrice });
            setChatMessages(prev => [...prev, { role: 'bot', text: `He actualizado el precio de la cancha ${pitchId} a $${newPrice} correctamente.` }]);
          } else if (call.name === "updateProductPrice") {
            const { productId, newPrice } = call.args as { productId: string, newPrice: number };
            await api.updateProduct(productId, { price: newPrice });
            setChatMessages(prev => [...prev, { role: 'bot', text: `He actualizado el precio del producto ${productId} a $${newPrice} correctamente.` }]);
          }
        }
      } else {
        const botResponse = response.text || "Lo siento, no pude procesar tu solicitud.";
        setChatMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setChatMessages(prev => [...prev, { role: 'bot', text: "Hubo un error al conectar con el asistente. Por favor, intenta de nuevo más tarde." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button (The "Little Ball") */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-50 transition-colors",
          isOpen ? "bg-zinc-900 text-white" : "bg-green-500 text-white"
        )}
      >
        {isOpen ? <X className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-[400px] h-[calc(100vh-12rem)] md:h-[600px] max-h-[700px] bg-white rounded-[32px] shadow-2xl z-50 overflow-hidden border border-zinc-100 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Asistente IA</h3>
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">En línea</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-green-500 text-white ml-auto rounded-tr-none" 
                      : "bg-zinc-100 text-zinc-700 mr-auto rounded-tl-none"
                  )}
                >
                  {msg.text}
                </motion.div>
              ))}
              {isTyping && (
                <div className="bg-zinc-100 text-zinc-400 p-4 rounded-2xl rounded-tl-none mr-auto flex gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20 hover:bg-green-400 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <button 
                  onClick={() => setChatInput("Cambia el precio de la Cancha 1 a $1800")}
                  className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-all"
                >
                  Cambiar Precios
                </button>
                <button 
                  onClick={() => setChatInput("¿Cómo van las ventas?")}
                  className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-200 px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-all"
                >
                  Estadísticas
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
