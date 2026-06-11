import { Clock, MapPin } from 'lucide-react';
import type { WorldCupMatch, WorldCupTeam } from '../../types/worldCup';
import {
  formatMatchTimeForArgentina,
  getMatchDisplayName,
  isArgentinaMatch,
} from '../../services/worldCupFixtureService';

type WorldCupMatchCardProps = {
  match: WorldCupMatch;
};

const statusLabel = {
  scheduled: 'Programado',
  live: 'En vivo',
  finished: 'Finalizado',
} as const;

const statusClass = {
  scheduled: 'border-emerald-300/45 bg-emerald-300/12 text-emerald-100',
  live: 'border-[#F6C453]/55 bg-[#F6C453]/14 text-[#FFE49A]',
  finished: 'border-[#74ACDF]/45 bg-[#74ACDF]/12 text-[#DDF3FF]',
} as const;

const TeamBadge = ({ team, isArgentinaTeam }: { team: WorldCupTeam; isArgentinaTeam: boolean }) => (
  <span
    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[11px] font-black shadow-inner ${
      isArgentinaTeam
        ? 'border-[#F6C453]/70 bg-[linear-gradient(135deg,#74ACDF_0%,#FFFFFF_50%,#74ACDF_100%)] text-[#081A33]'
        : 'border-[#74ACDF]/35 bg-[#081A33]/58 text-white'
    }`}
  >
    {team.emojiFlag || team.code.slice(0, 3)}
  </span>
);

const TeamLine = ({
  team,
  score,
}: {
  team: WorldCupTeam;
  score?: number;
}) => {
  const isArgentinaTeam = team.code === 'ARG';

  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <TeamBadge team={team} isArgentinaTeam={isArgentinaTeam} />
        <span className={`min-w-0 truncate text-base font-black ${isArgentinaTeam ? 'text-white' : 'text-[#F7FBFF]'}`}>
          {team.shortName}
        </span>
      </div>
      {score !== undefined ? (
        <span className="min-w-[2rem] text-right text-xl font-black text-[#FFE49A]">{score}</span>
      ) : null}
    </div>
  );
};

export function WorldCupMatchCard({ match }: WorldCupMatchCardProps) {
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
  const categoryLabel = match.groupLabel || match.stageLabel;
  const hasArgentina = isArgentinaMatch(match);

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border p-4 shadow-[0_18px_48px_rgba(8,26,51,0.30)] transition duration-300 hover:-translate-y-1 ${
        hasArgentina
          ? 'border-[#DDF3FF]/85 bg-[linear-gradient(145deg,rgba(36,90,141,0.96),rgba(116,172,223,0.34),rgba(8,26,51,0.92))] shadow-[0_0_46px_rgba(116,172,223,0.34)]'
          : 'border-[#74ACDF]/46 bg-[linear-gradient(145deg,rgba(22,59,102,0.92),rgba(8,26,51,0.94))]'
      }`}
    >
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[#74ACDF]" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/72" />
      <div aria-hidden="true" className="absolute right-0 top-0 h-20 w-20 bg-[linear-gradient(135deg,transparent_48%,rgba(246,196,83,0.30)_49%,rgba(246,196,83,0.08)_100%)]" />
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#74ACDF]/14 blur-2xl transition group-hover:bg-[#74ACDF]/22" />

      {hasArgentina ? (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 grid h-1 grid-cols-[1fr_0.65fr_1fr]">
          <div className="bg-[#74ACDF]" />
          <div className="bg-white" />
          <div className="bg-[#74ACDF]" />
        </div>
      ) : null}

      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2 pl-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#74ACDF]/40 bg-[#081A33]/54 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#DDF3FF]">
          <Clock className="h-4 w-4 text-[#74ACDF]" />
          {formatMatchTimeForArgentina(match)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasArgentina ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F6C453]/65 bg-[#F6C453]/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFE49A]">
              <span aria-hidden="true">★ ★ ★</span>
              ARGENTINA
            </span>
          ) : null}
          <span className="rounded-full border border-[#74ACDF]/34 bg-[#245A8D]/46 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#DDF3FF]">
            Partido {match.matchNumber}
          </span>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusClass[match.status]}`}>
            {statusLabel[match.status]}
          </span>
        </div>
      </div>

      <div aria-label={getMatchDisplayName(match)} className="relative space-y-3 pl-1">
        <TeamLine team={match.home} score={hasScore ? match.homeScore : undefined} />
        <div className="ml-6 h-px bg-[#74ACDF]/26" />
        <TeamLine team={match.away} score={hasScore ? match.awayScore : undefined} />
      </div>

      <div className="relative mt-4 grid gap-2 border-t border-[#74ACDF]/24 pt-4 text-sm font-bold text-[#DDF3FF]/78 sm:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-[#74ACDF]" />
          <span className="min-w-0 truncate">
            {match.city} - {match.stadium}
          </span>
        </div>
        <span className="text-[#DDF3FF]">{categoryLabel}</span>
      </div>
    </article>
  );
}
