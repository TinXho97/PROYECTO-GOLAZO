import { Activity, CalendarDays, Clock, Trophy } from 'lucide-react';
import {
  formatMatchTimeForArgentina,
  getAllWorldCupMatches,
  getMatchDisplayName,
  getNextWorldCupMatch,
  getTodayMatches,
  getTournamentState,
} from '../../services/worldCupFixtureService';

type WorldCupFixtureSummaryProps = {
  now: Date;
  visibleMatches: number;
};

export function WorldCupFixtureSummary({ now, visibleMatches }: WorldCupFixtureSummaryProps) {
  const totalMatches = getAllWorldCupMatches().length;
  const nextMatch = getNextWorldCupMatch(now);
  const tournamentState = getTournamentState(now);
  const todayCount = getTodayMatches(now).length;

  const items = [
    {
      label: 'Total fixture',
      value: `${totalMatches}`,
      detail: `${visibleMatches} en pantalla`,
      icon: Trophy,
    },
    {
      label: 'Próximo partido',
      value: nextMatch ? getMatchDisplayName(nextMatch) : 'Sin partidos pendientes',
      detail: nextMatch ? formatMatchTimeForArgentina(nextMatch) : 'Fixture completo',
      icon: Clock,
    },
    {
      label: 'Fase actual',
      value: tournamentState.currentStageLabel,
      detail: tournamentState.status === 'before' ? 'Antes del inicio' : 'Segun calendario',
      icon: Activity,
    },
    {
      label: 'Hoy',
      value: `${todayCount}`,
      detail: todayCount === 1 ? 'partido' : 'partidos',
      icon: CalendarDays,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isNextMatch = item.label === 'Próximo partido';

        return (
          <div
            key={item.label}
            className={`group relative overflow-hidden rounded-3xl border p-4 shadow-[0_16px_44px_rgba(8,26,51,0.24)] transition duration-300 hover:-translate-y-0.5 ${
              isNextMatch
                ? 'border-[#DDF3FF]/85 bg-[linear-gradient(145deg,rgba(36,90,141,0.92),rgba(116,172,223,0.30))] shadow-[0_0_42px_rgba(116,172,223,0.28)]'
                : 'border-[#74ACDF]/45 bg-[#245A8D]/58'
            }`}
          >
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/75" />
            <div aria-hidden="true" className="absolute right-0 top-0 h-14 w-14 bg-[linear-gradient(135deg,transparent_45%,rgba(246,196,83,0.28)_46%,rgba(246,196,83,0.08)_100%)]" />
            {isNextMatch ? (
              <div className="absolute right-4 top-4 text-[#F6C453] drop-shadow-[0_0_12px_rgba(246,196,83,0.5)]" aria-hidden="true">
                ★
              </div>
            ) : null}

            <div className="relative mb-3 flex items-center justify-between gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#DDF3FF]/80">
                {item.label}
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#DDF3FF]/35 bg-[#081A33]/40 text-[#DDF3FF] shadow-inner shadow-[#74ACDF]/10">
                <Icon className="h-5 w-5 shrink-0" />
              </span>
            </div>
            <div className="relative line-clamp-2 text-lg font-black leading-tight text-white">
              {item.value}
            </div>
            <div className="relative mt-1 text-sm font-bold text-[#DDF3FF]/72">
              {item.detail}
            </div>
          </div>
        );
      })}
    </section>
  );
}
