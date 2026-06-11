import { RotateCcw, Search } from 'lucide-react';
import type {
  WorldCupFilterMode,
  WorldCupGroupId,
} from '../../types/worldCup';

type WorldCupFixtureFiltersProps = {
  mode: WorldCupFilterMode;
  group: WorldCupGroupId | 'all';
  searchTerm: string;
  onModeChange: (mode: WorldCupFilterMode) => void;
  onGroupChange: (group: WorldCupGroupId | 'all') => void;
  onSearchTermChange: (value: string) => void;
  onClear: () => void;
};

const FILTERS: Array<{ id: WorldCupFilterMode; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'today', label: 'Hoy' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'argentina', label: 'Argentina' },
  { id: 'group', label: 'Fase de grupos' },
  { id: 'knockout', label: 'Eliminatorias' },
];

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

export function WorldCupFixtureFilters({
  mode,
  group,
  searchTerm,
  onModeChange,
  onGroupChange,
  onSearchTermChange,
  onClear,
}: WorldCupFixtureFiltersProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#74ACDF]/55 bg-[#163B66]/70 p-4 shadow-[0_18px_48px_rgba(8,26,51,0.28)]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/70" />
      <div aria-hidden="true" className="absolute right-0 top-0 h-full w-40 bg-[radial-gradient(circle_at_100%_0%,rgba(116,172,223,0.22),transparent_62%)]" />

      <div className="relative flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter.id === mode;
          const isArgentina = filter.id === 'argentina';

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onModeChange(filter.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition ${
                isActive
                  ? 'border-white bg-[#74ACDF] text-[#081A33] shadow-[0_0_22px_rgba(116,172,223,0.32)]'
                  : isArgentina
                    ? 'border-[#F6C453]/55 bg-[#081A33]/78 text-[#FFE49A] hover:border-[#FFE49A] hover:bg-[#163B66]'
                    : 'border-[#74ACDF]/35 bg-[#081A33]/74 text-[#DDF3FF] hover:border-[#DDF3FF]/70 hover:bg-[#245A8D]/70'
              }`}
            >
              {isArgentina ? <span className="text-[#F6C453]" aria-hidden="true">★</span> : null}
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="relative mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto]">
        <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#DDF3FF]/78">
          Grupo
          <select
            value={group}
            disabled={mode !== 'group'}
            onChange={(event) => onGroupChange(event.target.value as WorldCupGroupId | 'all')}
            className="h-12 rounded-2xl border border-[#74ACDF]/45 bg-[#081A33] px-3 text-sm font-black normal-case tracking-normal text-white outline-none transition enabled:hover:border-[#DDF3FF] enabled:focus:border-[#DDF3FF] enabled:focus:ring-2 enabled:focus:ring-[#74ACDF]/45 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {GROUPS.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'Todos los grupos' : `Grupo ${item}`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#DDF3FF]/78">
          Buscar
          <span className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#74ACDF]" />
            <input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Equipo, ciudad o estadio"
              className="h-12 w-full rounded-2xl border border-[#74ACDF]/45 bg-[#081A33] py-2 pl-11 pr-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition placeholder:text-[#DDF3FF]/45 hover:border-[#DDF3FF] focus:border-[#DDF3FF] focus:ring-2 focus:ring-[#74ACDF]/45"
            />
          </span>
        </label>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-12 items-center justify-center gap-2 self-end rounded-2xl border border-[#74ACDF]/50 bg-[#245A8D]/70 px-4 text-sm font-black text-white shadow-[0_10px_26px_rgba(8,26,51,0.22)] transition hover:border-white hover:bg-[#74ACDF] hover:text-[#081A33]"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar
        </button>
      </div>
    </section>
  );
}
