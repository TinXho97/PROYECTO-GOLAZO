import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ARGENTINA_LOCALE, ARGENTINA_TIME_ZONE } from '../../../services/worldCupFixtureService';
import { fifaWorldCupProvider } from '../../../services/fifaWorldCupProvider';
import type { WorldCupGroupId } from '../../../types/worldCup';
import type { WorldCupTeamDetail, WorldCupTeamSummary } from '../../../types/worldCupCenter';
import { WorldCupEmptyState } from './WorldCupEmptyState';
import { WorldCupErrorState } from './WorldCupErrorState';
import { WorldCupLoadingState } from './WorldCupLoadingState';
import { WorldCupSourceBadge } from './WorldCupSourceBadge';
import { WorldCupTeamCodeBadge } from './WorldCupTeamCodeBadge';

type PanelStatus = 'idle' | 'loading' | 'success' | 'error';
type DetailStatus = 'idle' | 'loading' | 'success' | 'error';

const GROUPS: Array<WorldCupGroupId | 'all'> = [
  'all',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
];

const DATE_FORMATTER = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
  timeZone: ARGENTINA_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function WorldCupTeamsPanel() {
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [teams, setTeams] = useState<WorldCupTeamSummary[]>([]);
  const [group, setGroup] = useState<WorldCupGroupId | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<WorldCupTeamSummary | null>(null);
  const [detailStatus, setDetailStatus] = useState<DetailStatus>('idle');
  const [detail, setDetail] = useState<WorldCupTeamDetail | null>(null);

  const loadTeams = () => {
    setStatus('loading');
    fifaWorldCupProvider
      .getTeams()
      .then((data) => {
        setTeams(data);
        setUpdatedAt(new Date());
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  };

  const loadDetail = (team: WorldCupTeamSummary) => {
    setSelectedTeam(team);
    setDetail(null);

    if (!fifaWorldCupProvider.getTeamDetail) {
      setDetailStatus('error');
      return;
    }

    setDetailStatus('loading');
    fifaWorldCupProvider
      .getTeamDetail(team.team.id)
      .then((data) => {
        setDetail(data);
        setDetailStatus('success');
      })
      .catch(() => setDetailStatus('error'));
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    const search = normalizeSearch(searchTerm);

    return teams.filter((item) => {
      if (group !== 'all' && item.team.group !== group) return false;
      if (!search) return true;
      return normalizeSearch(`${item.team.name} ${item.team.shortName} ${item.team.code}`).includes(search);
    });
  }, [group, searchTerm, teams]);

  if (status === 'loading' || status === 'idle') {
    return <WorldCupLoadingState label="Cargando equipos oficiales de FIFA" />;
  }

  if (status === 'error') {
    return <WorldCupErrorState onRetry={loadTeams} />;
  }

  return (
    <section className="space-y-5">
      <WorldCupSourceBadge updatedAt={updatedAt} onRetry={loadTeams} />

      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#DDF3FF]/78">
          Grupo
          <select
            value={group}
            onChange={(event) => setGroup(event.target.value as WorldCupGroupId | 'all')}
            className="h-12 rounded-2xl border border-[#74ACDF]/45 bg-[#081A33] px-3 text-sm font-black normal-case tracking-normal text-white outline-none transition hover:border-[#DDF3FF] focus:border-[#DDF3FF] focus:ring-2 focus:ring-[#74ACDF]/45"
          >
            {GROUPS.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'Todos los grupos' : `Grupo ${item}`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#DDF3FF]/78">
          Buscar equipo
          <span className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#74ACDF]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Argentina, Brasil, MEX..."
              className="h-12 w-full rounded-2xl border border-[#74ACDF]/45 bg-[#081A33] py-2 pl-11 pr-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition placeholder:text-[#DDF3FF]/45 hover:border-[#DDF3FF] focus:border-[#DDF3FF] focus:ring-2 focus:ring-[#74ACDF]/45"
            />
          </span>
        </label>
      </div>

      {selectedTeam ? (
        <div className="rounded-3xl border border-[#F6C453]/45 bg-[#F6C453]/12 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <WorldCupTeamCodeBadge code={selectedTeam.team.code} active />
              <div>
                <p className="text-base font-black text-white">{selectedTeam.team.name}</p>
                <p className="text-sm font-bold text-[#FFE49A]">Detalle FIFA bajo demanda</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadDetail(selectedTeam)}
              className="h-10 rounded-2xl border border-[#F6C453]/60 bg-[#081A33]/60 px-4 text-sm font-black text-[#FFE49A] transition hover:border-[#FFE49A] hover:bg-[#F6C453] hover:text-[#081A33] focus:outline-none focus:ring-2 focus:ring-[#FFE49A]"
            >
              Reintentar detalle
            </button>
          </div>

          {detailStatus === 'loading' ? (
            <p className="mt-3 text-sm font-bold text-[#DDF3FF]">Cargando detalle oficial...</p>
          ) : null}
          {detailStatus === 'error' ? (
            <p className="mt-3 text-sm font-bold text-[#DDF3FF]">
              No pudimos cargar el detalle remoto de este equipo. Se mantiene la informacion del fixture oficial.
            </p>
          ) : null}
          {detailStatus === 'success' && detail ? (
            <div className="mt-3 grid gap-2 text-sm font-bold text-[#DDF3FF] sm:grid-cols-3">
              <span>Codigo: {detail.code || selectedTeam.team.code}</span>
              <span>Confederacion: {detail.confederation || 'Sin dato'}</span>
              <span>Pais: {detail.countryCode || selectedTeam.team.countryCode || 'Sin dato'}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {filteredTeams.length === 0 ? (
        <WorldCupEmptyState title="No hay equipos para mostrar con esos filtros." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredTeams.map((item) => (
            <article
              key={item.team.id}
              className="rounded-3xl border border-[#74ACDF]/45 bg-[#163B66]/70 p-4 shadow-[0_18px_48px_rgba(8,26,51,0.28)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <WorldCupTeamCodeBadge code={item.team.code} active={item.team.code === 'ARG'} />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-white">{item.team.name}</h3>
                    <p className="text-sm font-bold text-[#DDF3FF]/72">
                      {item.team.groupLabel || 'Sin grupo'} - {item.team.code}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => loadDetail(item)}
                  className="shrink-0 rounded-full border border-[#74ACDF]/45 bg-[#081A33]/60 px-3 py-1 text-xs font-black text-[#DDF3FF] transition hover:border-white hover:bg-[#74ACDF] hover:text-[#081A33] focus:outline-none focus:ring-2 focus:ring-[#FFE49A]"
                >
                  FIFA
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  ['PJ', item.played],
                  ['GF', item.goalsFor],
                  ['GC', item.goalsAgainst],
                  ['PTS', item.points],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#74ACDF]/25 bg-[#081A33]/45 p-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#DDF3FF]/70">{label}</p>
                    <p className="text-lg font-black text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-[#74ACDF]/25 pt-3">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#DDF3FF]/70">
                  Proximos partidos
                </p>
                {item.nextMatches.length > 0 ? (
                  <div className="space-y-2">
                    {item.nextMatches.map((match) => (
                      <div key={match.id} className="rounded-2xl bg-[#081A33]/42 p-3 text-sm font-bold text-[#DDF3FF]">
                        <div className="flex items-center justify-between gap-3">
                          <span>vs {match.opponent}</span>
                          <span>{DATE_FORMATTER.format(new Date(match.kickoffUtc))} ARG</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-[#DDF3FF]/62">{match.venue}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-[#DDF3FF]/70">Sin partidos pendientes.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
