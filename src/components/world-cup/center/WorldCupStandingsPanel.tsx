import { useEffect, useState } from 'react';
import { fifaWorldCupProvider } from '../../../services/fifaWorldCupProvider';
import type { WorldCupGroupId } from '../../../types/worldCup';
import type { WorldCupStandingGroup } from '../../../types/worldCupCenter';
import { WorldCupEmptyState } from './WorldCupEmptyState';
import { WorldCupErrorState } from './WorldCupErrorState';
import { WorldCupLoadingState } from './WorldCupLoadingState';
import { WorldCupSourceBadge } from './WorldCupSourceBadge';
import { WorldCupTeamCodeBadge } from './WorldCupTeamCodeBadge';
import { WorldCupThirdPlacePanel } from './WorldCupThirdPlacePanel';

const GROUPS: WorldCupGroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

type PanelStatus = 'idle' | 'loading' | 'success' | 'error';
type StandingsView = 'groups' | 'thirds';

export function WorldCupStandingsPanel() {
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [groups, setGroups] = useState<WorldCupStandingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<WorldCupGroupId>('A');
  const [view, setView] = useState<StandingsView>('groups');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadStandings = () => {
    setStatus('loading');
    fifaWorldCupProvider
      .getStandings()
      .then((data) => {
        setGroups(data);
        setUpdatedAt(new Date());
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(() => {
    loadStandings();
  }, []);

  if (status === 'loading' || status === 'idle') {
    return <WorldCupLoadingState label="Calculando posiciones con datos oficiales de FIFA" />;
  }

  if (status === 'error') {
    return <WorldCupErrorState onRetry={loadStandings} />;
  }

  const selected = groups.find((group) => group.group === selectedGroup);

  return (
    <section className="space-y-5">
      <WorldCupSourceBadge updatedAt={updatedAt} onRetry={loadStandings} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView('groups')}
          className={`h-11 rounded-2xl border px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#FFE49A] ${
            view === 'groups'
              ? 'border-white bg-[#74ACDF] text-[#081A33]'
              : 'border-[#74ACDF]/40 bg-[#081A33]/70 text-[#DDF3FF] hover:border-white'
          }`}
        >
          Grupos
        </button>
        <button
          type="button"
          onClick={() => setView('thirds')}
          className={`h-11 rounded-2xl border px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#FFE49A] ${
            view === 'thirds'
              ? 'border-white bg-[#74ACDF] text-[#081A33]'
              : 'border-[#74ACDF]/40 bg-[#081A33]/70 text-[#DDF3FF] hover:border-white'
          }`}
        >
          Mejores terceros
        </button>
      </div>

      {view === 'thirds' ? (
        <WorldCupThirdPlacePanel groups={groups} />
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {GROUPS.map((group) => {
              const isActive = group === selectedGroup;
              return (
                <button
                  key={group}
                  type="button"
                  aria-selected={isActive}
                  onClick={() => setSelectedGroup(group)}
                  className={`h-10 min-w-10 rounded-2xl border px-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#FFE49A] ${
                    isActive
                      ? 'border-white bg-[#245A8D] text-white'
                      : 'border-[#74ACDF]/35 bg-[#DDF3FF]/12 text-[#DDF3FF] hover:border-white'
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-[#F6C453]/45 bg-[#F6C453]/12 p-4 text-sm font-bold text-[#FFE49A]">
            Clasifican los dos primeros y los ocho mejores terceros.
          </div>

          {!selected ? (
            <WorldCupEmptyState title="No hay datos para este grupo." />
          ) : (
            <>
              {!selected.hasStarted ? (
                <div className="rounded-3xl border border-[#74ACDF]/45 bg-[#245A8D]/38 p-4 text-sm font-bold text-[#DDF3FF]">
                  El grupo todavia no comenzo. La tabla se ordena de forma neutral hasta que haya resultados oficiales.
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-3xl border border-[#74ACDF]/45 bg-[#081A33]/72">
                <table className="min-w-[820px] w-full border-collapse text-left text-sm">
                  <thead className="bg-[#245A8D]/80 text-[11px] uppercase tracking-[0.14em] text-[#DDF3FF]">
                    <tr>
                      {['Pos', 'Seleccion', 'PJ', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'PTS'].map((label) => (
                        <th key={label} className="px-4 py-3 font-black">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.teams.map((team) => (
                      <tr
                        key={team.team.id}
                        className={`border-t border-[#74ACDF]/20 ${
                          team.isDirectQualification
                            ? 'bg-[#74ACDF]/12'
                            : team.isThirdPlace
                              ? 'bg-[#F6C453]/8'
                              : 'bg-[#081A33]/20'
                        }`}
                      >
                        <td className="px-4 py-3 font-black text-[#FFE49A]">{team.position}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <WorldCupTeamCodeBadge code={team.team.code} active={team.isDirectQualification} />
                            <span className="font-black text-white">{team.team.shortName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-white">{team.played}</td>
                        <td className="px-4 py-3 font-bold text-white">{team.wins}</td>
                        <td className="px-4 py-3 font-bold text-white">{team.draws}</td>
                        <td className="px-4 py-3 font-bold text-white">{team.losses}</td>
                        <td className="px-4 py-3 font-bold text-white">{team.goalsFor}</td>
                        <td className="px-4 py-3 font-bold text-white">{team.goalsAgainst}</td>
                        <td className="px-4 py-3 font-bold text-white">{team.goalDifference}</td>
                        <td className="px-4 py-3 text-lg font-black text-[#FFE49A]">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
