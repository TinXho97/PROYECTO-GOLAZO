import { useEffect, useState } from 'react';
import { fifaWorldCupProvider } from '../../../services/fifaWorldCupProvider';
import type { WorldCupPlayerStat } from '../../../types/worldCupCenter';
import { WorldCupEmptyState } from './WorldCupEmptyState';
import { WorldCupErrorState } from './WorldCupErrorState';
import { WorldCupLoadingState } from './WorldCupLoadingState';
import { WorldCupSourceBadge } from './WorldCupSourceBadge';
import { WorldCupTeamCodeBadge } from './WorldCupTeamCodeBadge';

type PanelStatus = 'idle' | 'loading' | 'success' | 'error';

export function WorldCupScorersPanel() {
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [scorers, setScorers] = useState<WorldCupPlayerStat[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadScorers = () => {
    setStatus('loading');
    fifaWorldCupProvider
      .getScorers()
      .then((data) => {
        setScorers(data);
        setUpdatedAt(new Date());
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(() => {
    loadScorers();
  }, []);

  if (status === 'loading' || status === 'idle') {
    return <WorldCupLoadingState label="Buscando goleadores oficiales de FIFA" />;
  }

  if (status === 'error') {
    return <WorldCupErrorState onRetry={loadScorers} />;
  }

  return (
    <section className="space-y-5">
      <WorldCupSourceBadge updatedAt={updatedAt} onRetry={loadScorers} />

      {scorers.length === 0 ? (
        <WorldCupEmptyState
          title="Todavia no hay goles registrados en el Mundial 2026."
          detail="La tabla se actualizara automaticamente con los datos oficiales de FIFA."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#74ACDF]/45 bg-[#081A33]/72">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#245A8D]/80 text-[11px] uppercase tracking-[0.14em] text-[#DDF3FF]">
              <tr>
                {['Pos', 'Jugador', 'Seleccion', 'Goles', 'Partidos', 'Minutos'].map((label) => (
                  <th key={label} className="px-4 py-3 font-black">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scorers.map((scorer, index) => (
                <tr key={scorer.id} className="border-t border-[#74ACDF]/20 bg-[#081A33]/20">
                  <td className="px-4 py-3 font-black text-[#FFE49A]">{index + 1}</td>
                  <td className="px-4 py-3 font-black text-white">{scorer.playerName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <WorldCupTeamCodeBadge code={scorer.team.code} />
                      <span className="font-bold text-[#DDF3FF]">{scorer.team.shortName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-lg font-black text-[#FFE49A]">{scorer.value}</td>
                  <td className="px-4 py-3 font-bold text-white">{scorer.matches ?? '-'}</td>
                  <td className="px-4 py-3 font-bold text-white">{scorer.minutes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
