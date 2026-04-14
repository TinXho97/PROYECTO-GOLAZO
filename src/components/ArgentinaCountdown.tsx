import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface Match {
  opponent: string;
  date: Date;
  competition: string;
}

const ARGENTINA_MATCHES: Match[] = [
  { opponent: 'Argentina vs Argelia', date: new Date('2026-06-16T22:00:00'), competition: 'Mundial 2026 - Grupo J' },
  { opponent: 'Argentina vs Austria', date: new Date('2026-06-22T14:00:00'), competition: 'Mundial 2026 - Grupo J' },
  { opponent: 'Jordania vs Argentina', date: new Date('2026-06-27T23:00:00'), competition: 'Mundial 2026 - Grupo J' },
];

interface ArgentinaCountdownProps {
  className?: string;
  variant?: 'floating' | 'card';
}

export default function ArgentinaCountdown({ className, variant = 'card' }: ArgentinaCountdownProps) {
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [showFixture, setShowFixture] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      // Filter specifically for World Cup matches for the countdown
      const upcoming = ARGENTINA_MATCHES
        .filter(m => m.date > now && m.competition.includes('Mundial'))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const target = upcoming[0];
      setNextMatch(target);

      if (target) {
        const diff = target.date.getTime() - now.getTime();
        
        if (diff > 0) {
          setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60)
          });
        }
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!nextMatch) return null;

  if (variant === 'floating') {
    return (
      <div className={cn("flex flex-col items-center gap-2 relative", className)}>
        <div className="flex gap-1.5">
          <div className="flex flex-col items-center bg-white/95 backdrop-blur-md border border-zinc-200 p-2 rounded-xl min-w-[45px] shadow-xl">
            <span className="text-lg font-black text-sky-500 leading-none">{timeLeft.days}</span>
            <span className="text-[7px] font-black text-zinc-400 uppercase tracking-tighter">Días</span>
          </div>
          <div className="flex flex-col items-center bg-white/95 backdrop-blur-md border border-zinc-200 p-2 rounded-xl min-w-[45px] shadow-xl">
            <span className="text-lg font-black text-zinc-900 leading-none">{timeLeft.hours}</span>
            <span className="text-[7px] font-black text-zinc-400 uppercase tracking-tighter">Hs</span>
          </div>
          <div className="flex flex-col items-center bg-white/95 backdrop-blur-md border border-zinc-200 p-2 rounded-xl min-w-[45px] shadow-xl">
            <span className="text-lg font-black text-zinc-900 leading-none">{timeLeft.minutes}</span>
            <span className="text-[7px] font-black text-zinc-400 uppercase tracking-tighter">Min</span>
          </div>
        </div>
        <button 
          onClick={() => setShowFixture(!showFixture)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500 shadow-xl shadow-sky-500/30 hover:bg-sky-400 transition-all hover:scale-105 active:scale-95"
        >
          <Trophy className="w-3 h-3 text-white" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">ARGENTINA JUEGA</span>
        </button>

        {/* Floating Fixture Popover */}
        <AnimatePresence>
          {showFixture && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full right-0 mb-4 w-64 bg-white rounded-3xl shadow-2xl border border-zinc-100 p-4 z-50"
            >
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-sky-500" />
                  <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Fixture Mundial</span>
                </div>
                <button onClick={() => setShowFixture(false)}>
                  <X className="w-3 h-3 text-zinc-400" />
                </button>
              </div>
              <div className="space-y-3">
                {ARGENTINA_MATCHES.filter(m => m.competition.includes('Mundial')).map((match, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-900 truncate w-32">{match.opponent}</span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase">{match.competition}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-sky-500 block">
                        {format(match.date, "d 'de' MMM", { locale: es })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4 relative w-full", className)}>
      <div className="flex justify-center gap-2 w-full">
        <div className="flex-1 flex flex-col items-center bg-zinc-50 border border-zinc-100 p-3 rounded-2xl shadow-sm group/box hover:bg-white transition-all">
          <span className="text-2xl font-black text-sky-500 leading-none group-hover/box:scale-110 transition-transform">{timeLeft.days}</span>
          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1">Días</span>
        </div>
        <div className="flex-1 flex flex-col items-center bg-zinc-50 border border-zinc-100 p-3 rounded-2xl shadow-sm group/box hover:bg-white transition-all">
          <span className="text-2xl font-black text-zinc-900 leading-none group-hover/box:scale-110 transition-transform">{timeLeft.hours}</span>
          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1">Horas</span>
        </div>
        <div className="flex-1 flex flex-col items-center bg-zinc-50 border border-zinc-100 p-3 rounded-2xl shadow-sm group/box hover:bg-white transition-all">
          <span className="text-2xl font-black text-zinc-900 leading-none group-hover/box:scale-110 transition-transform">{timeLeft.minutes}</span>
          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1">Min</span>
        </div>
      </div>
      <button 
        onClick={() => setShowFixture(!showFixture)}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-all group active:scale-95 w-full border border-sky-100"
      >
        <Trophy className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          ARGENTINA JUEGA
        </span>
      </button>

      {/* Mini Fixture - Only visible when clicked */}
      <AnimatePresence>
        {showFixture && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-lg mt-1">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-50 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-sky-500" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Fixture Mundial 2026</span>
                </div>
                <button onClick={() => setShowFixture(false)}>
                  <X className="w-3 h-3 text-zinc-300" />
                </button>
              </div>
              <div className="space-y-3">
                {ARGENTINA_MATCHES.filter(m => m.competition.includes('Mundial')).map((match, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-800 truncate w-32">{match.opponent}</span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase">{match.competition}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-sky-500 block">
                        {format(match.date, "d 'de' MMM", { locale: es })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

