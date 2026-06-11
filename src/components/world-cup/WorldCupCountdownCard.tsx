import { useEffect, useState } from 'react';
import { CalendarDays, ChevronRight, Clock, Trophy } from 'lucide-react';
import {
  formatMatchDateForArgentina,
  formatMatchTimeForArgentina,
  getCountdownToMatch,
  getMatchDisplayName,
  getNextWorldCupMatch,
} from '../../services/worldCupFixtureService';
import { WorldCupFixtureModal } from './WorldCupFixtureModal';

export function WorldCupCountdownCard() {
  const [now, setNow] = useState(() => new Date());
  const [isFixtureOpen, setIsFixtureOpen] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const nextMatch = getNextWorldCupMatch(now);
  const countdown = getCountdownToMatch(nextMatch, now);
  const matchLabel = nextMatch ? getMatchDisplayName(nextMatch) : 'Fixture completo';
  const timeLabel = nextMatch
    ? `${formatMatchDateForArgentina(nextMatch)} - ${formatMatchTimeForArgentina(nextMatch)}`
    : 'Sin partidos pendientes';

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-sky-200/35 bg-slate-950/70 p-2.5 shadow-2xl shadow-sky-950/30 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-300 via-white to-amber-200" />
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/55 bg-[linear-gradient(135deg,#f8fafc_0%,#bae6fd_52%,#e0f2fe_100%)] text-sky-800 shadow-lg shadow-sky-950/20">
              <Trophy className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-100">
                Rumbo al Mundial 2026
              </p>
              <p className="truncate text-sm font-black text-white">{matchLabel}</p>
            </div>
          </div>
          <div className="hidden rounded-full border border-amber-200/35 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100 sm:block">
            ARG
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Dias', value: countdown.days },
            { label: 'Horas', value: countdown.hours },
            { label: 'Min', value: countdown.minutes },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-sky-200/20 bg-white/[0.09] px-2 py-2.5 text-center shadow-inner shadow-sky-950/20"
            >
              <div className="text-xl font-black leading-none text-white">
                {countdown.hasStarted ? '0' : item.value}
              </div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2.5 flex flex-col gap-2.5 rounded-xl border border-sky-200/20 bg-white/[0.06] p-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-sky-100">
              <Clock className="h-4 w-4 text-amber-200" />
              Proximo partido
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-sm font-bold text-white/80">
              <CalendarDays className="h-4 w-4 shrink-0 text-cyan-200" />
              <span className="truncate">{timeLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFixtureOpen(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-sky-50 px-4 text-sm font-black text-slate-950 shadow-lg shadow-sky-950/20 transition hover:bg-amber-100"
          >
            Ver fixture
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <WorldCupFixtureModal isOpen={isFixtureOpen} onClose={() => setIsFixtureOpen(false)} />
    </>
  );
}
