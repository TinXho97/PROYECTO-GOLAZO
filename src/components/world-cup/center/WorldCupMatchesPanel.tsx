import type { WorldCupFilterMode, WorldCupGroupId, WorldCupMatch } from '../../../types/worldCup';
import type { WorldCupDataSource } from '../../../types/worldCupCenter';
import { WorldCupFixtureFilters } from '../WorldCupFixtureFilters';
import { WorldCupFixtureSummary } from '../WorldCupFixtureSummary';
import { WorldCupMatchCard } from '../WorldCupMatchCard';
import { WorldCupEmptyState } from './WorldCupEmptyState';
import { WorldCupSourceBadge } from './WorldCupSourceBadge';

type MatchDateGroup = {
  dateKey: string;
  label: string;
  matches: WorldCupMatch[];
};

type WorldCupMatchesPanelProps = {
  now: Date;
  mode: WorldCupFilterMode;
  group: WorldCupGroupId | 'all';
  searchTerm: string;
  visibleMatches: number;
  groupedMatches: MatchDateGroup[];
  source: WorldCupDataSource;
  updatedAt: Date | null;
  onModeChange: (mode: WorldCupFilterMode) => void;
  onGroupChange: (group: WorldCupGroupId | 'all') => void;
  onSearchTermChange: (value: string) => void;
  onClear: () => void;
  onRetry: () => void;
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function WorldCupMatchesPanel({
  now,
  mode,
  group,
  searchTerm,
  visibleMatches,
  groupedMatches,
  source,
  updatedAt,
  onModeChange,
  onGroupChange,
  onSearchTermChange,
  onClear,
  onRetry,
}: WorldCupMatchesPanelProps) {
  return (
    <div className="space-y-5">
      <WorldCupSourceBadge source={source} updatedAt={updatedAt} onRetry={onRetry} />

      <WorldCupFixtureSummary now={now} visibleMatches={visibleMatches} />

      <WorldCupFixtureFilters
        mode={mode}
        group={group}
        searchTerm={searchTerm}
        onModeChange={onModeChange}
        onGroupChange={onGroupChange}
        onSearchTermChange={onSearchTermChange}
        onClear={onClear}
      />

      {groupedMatches.length > 0 ? (
        <div className="space-y-5">
          {groupedMatches.map((grouped) => (
            <section key={grouped.dateKey} className="space-y-3">
              <div className="sticky top-0 z-10 overflow-hidden rounded-2xl border border-[#74ACDF]/55 bg-[linear-gradient(90deg,rgba(22,59,102,0.96),rgba(36,90,141,0.9),rgba(8,26,51,0.96))] px-4 py-3 shadow-[0_12px_32px_rgba(8,26,51,0.34)] backdrop-blur-xl">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/70" />
                <div aria-hidden="true" className="absolute right-0 top-0 h-full w-24 bg-[linear-gradient(90deg,transparent,rgba(246,196,83,0.16))]" />
                <h3 className="relative flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#DDF3FF]">
                  <span className="text-[#F6C453]">***</span>
                  {capitalize(grouped.label)}
                </h3>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {grouped.matches.map((match) => (
                  <WorldCupMatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <WorldCupEmptyState
          title="No hay partidos para mostrar."
          detail="Proba limpiar los filtros o cambiar la busqueda."
        />
      )}
    </div>
  );
}
