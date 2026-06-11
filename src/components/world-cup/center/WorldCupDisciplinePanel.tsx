import { useEffect, useState } from 'react';
import { fifaWorldCupProvider } from '../../../services/fifaWorldCupProvider';
import type { WorldCupDisciplineSummary } from '../../../types/worldCupCenter';
import { WorldCupEmptyState } from './WorldCupEmptyState';
import { WorldCupErrorState } from './WorldCupErrorState';
import { WorldCupLoadingState } from './WorldCupLoadingState';
import { WorldCupSourceBadge } from './WorldCupSourceBadge';
import { WorldCupTeamCodeBadge } from './WorldCupTeamCodeBadge';

type PanelStatus = 'idle' | 'loading' | 'success' | 'error';
type DisciplineView = 'players' | 'teams';

export function WorldCupDisciplinePanel() {
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [summary, setSummary] = useState<WorldCupDisciplineSummary>({ players: [], teams: [] });
  const [view, setView] = useState<DisciplineView>('players');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadDiscipline = () => {
    setStatus('loading');
    fifaWorldCupProvider
      .getDiscipline()
      .then((data) => {
        setSummary(data);
        setUpdatedAt(new Date());
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(() => {
    loadDiscipline();
  }, []);

  if (status === 'loading' || status === 'idle') {
    return <WorldCupLoadingState label="Buscando tarjetas oficiales de FIFA" />;
  }

  if (status === 'error') {
    return <WorldCupErrorState onRetry={loadDiscipline} />;
  }

  const isEmpty = summary.players.length === 0 && summary.teams.length === 0;

  return (
    <section className="space-y-5">
      <WorldCupSourceBadge updatedAt={updatedAt} onRetry={loadDiscipline} />

      {isEmpty ? (
        <WorldCupEmptyState title="Todavia no hay tarjetas registradas." />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView('players')}
              className={`h-11 rounded-2xl border px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#FFE49A] ${
                view === 'players'
                  ? 'border-white bg-[#74ACDF] text-[#081A33]'
                  : 'border-[#74ACDF]/40 bg-[#081A33]/70 text-[#DDF3FF] hover:border-white'
              }`}
            >
              Jugadores
            </button>
            <button
              type="button"
              onClick={() => setView('teams')}
              className={`h-11 rounded-2xl border px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#FFE49A] ${
                view === 'teams'
                  ? 'border-white bg-[#74ACDF] text-[#081A33]'
                  : 'border-[#74ACDF]/40 bg-[#081A33]/70 text-[#DDF3FF] hover:border-white'
              }`}
            >
              Por equipo
            </button>
          </div>

          {view === 'players' ? (
            <div className="overflow-x-auto rounded-3xl border border-[#74ACDF]/45 bg-[#081A33]/72">
              <table className="min-w-[820px] w-full border-collapse text-left text-sm">
                <thead className="bg-[#245A8D]/80 text-[11px] uppercase tracking-[0.14em] text-[#DDF3FF]">
                  <tr>
                    {['Jugador', 'Seleccion', 'Amarillas', 'Rojas', 'Doble amarilla', 'Partidos'].map((label) => (
                      <th key={label} className="px-4 py-3 font-black">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.players.map((player) => (
                    <tr key={player.id} className="border-t border-[#74ACDF]/20 bg-[#081A33]/20">
                      <td className="px-4 py-3 font-black text-white">{player.playerName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <WorldCupTeamCodeBadge code={player.team.code} />
                          <span className="font-bold text-[#DDF3FF]">{player.team.shortName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-black text-[#FFE49A]">{player.yellowCards}</td>
                      <td className="px-4 py-3 font-black text-[#FFE49A]">{player.redCards}</td>
                      <td className="px-4 py-3 font-bold text-white">{player.doubleYellowCards ?? '-'}</td>
                      <td className="px-4 py-3 font-bold text-white">{player.relatedMatches.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-[#74ACDF]/45 bg-[#081A33]/72">
              <table className="min-w-[560px] w-full border-collapse text-left text-sm">
                <thead className="bg-[#245A8D]/80 text-[11px] uppercase tracking-[0.14em] text-[#DDF3FF]">
                  <tr>
                    {['Seleccion', 'Amarillas', 'Rojas'].map((label) => (
                      <th key={label} className="px-4 py-3 font-black">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.teams.map((team) => (
                    <tr key={team.team.id} className="border-t border-[#74ACDF]/20 bg-[#081A33]/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <WorldCupTeamCodeBadge code={team.team.code} />
                          <span className="font-black text-white">{team.team.shortName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-black text-[#FFE49A]">{team.yellowCards}</td>
                      <td className="px-4 py-3 font-black text-[#FFE49A]">{team.redCards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
