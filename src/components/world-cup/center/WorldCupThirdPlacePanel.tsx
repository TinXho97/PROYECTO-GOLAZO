import type { WorldCupStandingGroup, WorldCupThirdPlaceStanding } from '../../../types/worldCupCenter';
import { WorldCupEmptyState } from './WorldCupEmptyState';
import { WorldCupTeamCodeBadge } from './WorldCupTeamCodeBadge';

type WorldCupThirdPlacePanelProps = {
  groups: WorldCupStandingGroup[];
};

const buildThirdPlaces = (groups: WorldCupStandingGroup[]): WorldCupThirdPlaceStanding[] =>
  groups
    .filter((group) => group.hasStarted)
    .map((group) => group.teams.find((team) => team.position === 3))
    .filter((team): team is NonNullable<typeof team> => Boolean(team))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.team.name.localeCompare(b.team.name, 'es')
    )
    .map((team, index) => ({
      ...team,
      thirdPlacePosition: index + 1,
      qualificationLabel:
        index < 8 ? 'Clasificacion provisional' : 'Fuera de clasificacion provisional',
    }));

export function WorldCupThirdPlacePanel({ groups }: WorldCupThirdPlacePanelProps) {
  const thirdPlaces = buildThirdPlaces(groups);

  if (thirdPlaces.length === 0) {
    return (
      <WorldCupEmptyState title="La tabla de mejores terceros estara disponible cuando comiencen los grupos." />
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-[#F6C453]/45 bg-[#F6C453]/12 p-4 text-sm font-bold text-[#FFE49A]">
        Los primeros 8 terceros clasifican de forma provisional mientras se completan los grupos.
      </div>

      <div className="overflow-x-auto rounded-3xl border border-[#74ACDF]/45 bg-[#081A33]/72">
        <table className="min-w-[780px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#245A8D]/80 text-[11px] uppercase tracking-[0.14em] text-[#DDF3FF]">
            <tr>
              {['Pos', 'Seleccion', 'Grupo', 'PJ', 'GF', 'GC', 'DG', 'PTS', 'Estado'].map((label) => (
                <th key={label} className="px-4 py-3 font-black">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {thirdPlaces.map((team) => {
              const isQualified = team.thirdPlacePosition <= 8;
              return (
                <tr
                  key={team.team.id}
                  className={`border-t border-[#74ACDF]/20 ${
                    isQualified ? 'bg-[#74ACDF]/10' : 'bg-[#081A33]/20'
                  }`}
                >
                  <td className="px-4 py-3 font-black text-[#FFE49A]">{team.thirdPlacePosition}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <WorldCupTeamCodeBadge code={team.team.code} active={isQualified} />
                      <span className="font-black text-white">{team.team.shortName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#DDF3FF]">Grupo {team.group}</td>
                  <td className="px-4 py-3 font-bold text-white">{team.played}</td>
                  <td className="px-4 py-3 font-bold text-white">{team.goalsFor}</td>
                  <td className="px-4 py-3 font-bold text-white">{team.goalsAgainst}</td>
                  <td className="px-4 py-3 font-bold text-white">{team.goalDifference}</td>
                  <td className="px-4 py-3 text-lg font-black text-[#FFE49A]">{team.points}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${
                        isQualified
                          ? 'border-emerald-300/55 bg-emerald-300/12 text-emerald-100'
                          : 'border-[#74ACDF]/35 bg-[#245A8D]/35 text-[#DDF3FF]'
                      }`}
                    >
                      {team.qualificationLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
