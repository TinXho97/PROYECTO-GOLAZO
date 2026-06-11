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
        return (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">
                {item.label}
              </span>
              <Icon className="h-5 w-5 shrink-0 text-emerald-300" />
            </div>
            <div className="line-clamp-2 text-lg font-black leading-tight text-white">{item.value}</div>
            <div className="mt-1 text-sm font-bold text-white/60">{item.detail}</div>
          </div>
        );
      })}
    </section>
  );
}
