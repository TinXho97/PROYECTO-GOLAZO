import { Clock, MapPin } from 'lucide-react';
import type { WorldCupMatch, WorldCupTeam } from '../../types/worldCup';
import {
  formatMatchTimeForArgentina,
  getMatchDisplayName,
} from '../../services/worldCupFixtureService';

type WorldCupMatchCardProps = {
  match: WorldCupMatch;
};

const statusLabel = {
  scheduled: 'Programado',
  live: 'En vivo',
  finished: 'Finalizado',
} as const;

const TeamBadge = ({ team }: { team: WorldCupTeam }) => (
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[11px] font-black text-white">
    {team.emojiFlag || team.code.slice(0, 3)}
  </span>
);

const TeamLine = ({
  team,
  score,
}: {
  team: WorldCupTeam;
  score?: number;
}) => (
  <div className="flex min-w-0 items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      <TeamBadge team={team} />
      <span className="min-w-0 truncate text-base font-black text-white">{team.shortName}</span>
    </div>
    {score !== undefined ? (
      <span className="min-w-[2rem] text-right text-xl font-black text-amber-200">{score}</span>
    ) : null}
  </div>
);

export function WorldCupMatchCard({ match }: WorldCupMatchCardProps) {
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
  const categoryLabel = match.groupLabel || match.stageLabel;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-lg shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
          <Clock className="h-4 w-4 text-emerald-300" />
          {formatMatchTimeForArgentina(match)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/80">
            Partido {match.matchNumber}
          </span>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
            {statusLabel[match.status]}
          </span>
        </div>
      </div>

      <div aria-label={getMatchDisplayName(match)} className="space-y-3">
        <TeamLine team={match.home} score={hasScore ? match.homeScore : undefined} />
        <div className="ml-5 h-px bg-white/10" />
        <TeamLine team={match.away} score={hasScore ? match.awayScore : undefined} />
      </div>

      <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-sm font-bold text-white/75 sm:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-cyan-200" />
          <span className="min-w-0 truncate">
            {match.city} - {match.stadium}
          </span>
        </div>
        <span className="text-cyan-100">{categoryLabel}</span>
      </div>
    </article>
  );
}
