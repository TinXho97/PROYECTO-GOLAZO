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
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter.id === mode;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onModeChange(filter.id)}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                isActive
                  ? 'border-emerald-300 bg-emerald-300 text-slate-950'
                  : 'border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/15'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto]">
        <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/60">
          Grupo
          <select
            value={group}
            disabled={mode !== 'group'}
            onChange={(event) => onGroupChange(event.target.value as WorldCupGroupId | 'all')}
            className="h-12 rounded-xl border border-white/15 bg-slate-950 px-3 text-sm font-black normal-case tracking-normal text-white outline-none transition enabled:hover:border-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {GROUPS.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'Todos los grupos' : `Grupo ${item}`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/60">
          Buscar
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
            <input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Equipo, ciudad o estadio"
              className="h-12 w-full rounded-xl border border-white/15 bg-slate-950 py-2 pl-10 pr-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition placeholder:text-white/35 hover:border-white/30 focus:border-emerald-300"
            />
          </span>
        </label>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-12 items-center justify-center gap-2 self-end rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:border-white/30 hover:bg-white/15"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar
        </button>
      </div>
    </section>
  );
}
