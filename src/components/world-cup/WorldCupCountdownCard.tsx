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
      <div className="relative overflow-hidden rounded-3xl border border-[#74ACDF]/60 bg-[linear-gradient(145deg,rgba(22,59,102,0.96),rgba(8,26,51,0.94))] p-3 shadow-[0_20px_58px_rgba(8,26,51,0.34),0_0_34px_rgba(116,172,223,0.16)] backdrop-blur-xl">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 grid h-1 grid-cols-[1fr_0.65fr_1fr]">
          <div className="bg-[#74ACDF]" />
          <div className="bg-white" />
          <div className="bg-[#74ACDF]" />
        </div>
        <div aria-hidden="true" className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-[#74ACDF]/18 blur-2xl" />
        <div aria-hidden="true" className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-[#F6C453]/10 blur-2xl" />

        <div className="relative mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-[linear-gradient(135deg,#DDF3FF_0%,#74ACDF_54%,#FFFFFF_100%)] text-[#081A33] shadow-[0_0_24px_rgba(116,172,223,0.26)]">
              <Trophy className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[#F6C453]/55 bg-[#F6C453]/12 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-[#FFE49A]">
                <span aria-hidden="true">★</span>
                VAMOS ARGENTINA
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#DDF3FF]">
                Rumbo al Mundial 2026
              </p>
              <p className="truncate text-sm font-black text-white">{matchLabel}</p>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <div className="flex items-center justify-end gap-1 text-[#F6C453] drop-shadow-[0_0_12px_rgba(246,196,83,0.42)]">
              <span className="text-sm leading-none">★</span>
              <span className="text-base leading-none">★</span>
              <span className="text-sm leading-none">★</span>
            </div>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#DDF3FF]/70">ARG</p>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-2">
          {[
            { label: 'Dias', value: countdown.days },
            { label: 'Horas', value: countdown.hours },
            { label: 'Min', value: countdown.minutes },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#74ACDF]/36 bg-[#081A33]/58 px-2 py-2.5 text-center shadow-inner shadow-[#74ACDF]/10"
            >
              <div className="text-xl font-black leading-none text-white">
                {countdown.hasStarted ? '0' : item.value}
              </div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#DDF3FF]/72">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-3 flex flex-col gap-2.5 rounded-2xl border border-[#74ACDF]/36 bg-[#245A8D]/34 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#DDF3FF]">
              <Clock className="h-4 w-4 text-[#F6C453]" />
              Proximo partido
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-sm font-bold text-white/86">
              <CalendarDays className="h-4 w-4 shrink-0 text-[#74ACDF]" />
              <span className="truncate">{timeLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFixtureOpen(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/80 bg-[#DDF3FF] px-4 text-sm font-black text-[#081A33] shadow-[0_12px_26px_rgba(116,172,223,0.24)] transition hover:bg-[#FFE49A] focus:outline-none focus:ring-2 focus:ring-[#74ACDF]"
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
