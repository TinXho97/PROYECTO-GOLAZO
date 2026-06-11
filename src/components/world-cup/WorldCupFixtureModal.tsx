import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { worldCup2026FixtureMetadata } from '../../data/worldCup2026Fixture';
import {
  ARGENTINA_LOCALE,
  ARGENTINA_TIME_ZONE,
  filterWorldCupMatches,
  groupMatchesByArgentinaDate,
} from '../../services/worldCupFixtureService';
import type {
  WorldCupFilterMode,
  WorldCupGroupId,
} from '../../types/worldCup';
import { WorldCupFixtureFilters } from './WorldCupFixtureFilters';
import { WorldCupFixtureSummary } from './WorldCupFixtureSummary';
import { WorldCupMatchCard } from './WorldCupMatchCard';

type WorldCupFixtureModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const VERIFIED_DATE_FORMATTER = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
  timeZone: ARGENTINA_TIME_ZONE,
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function WorldCupFixtureModal({ isOpen, onClose }: WorldCupFixtureModalProps) {
  const [mode, setMode] = useState<WorldCupFilterMode>('upcoming');
  const [group, setGroup] = useState<WorldCupGroupId | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  const filteredMatches = useMemo(
    () => filterWorldCupMatches({ mode, group, searchTerm, now }),
    [mode, group, searchTerm, now]
  );

  const groupedMatches = useMemo(
    () => groupMatchesByArgentinaDate(filteredMatches),
    [filteredMatches]
  );

  const clearFilters = () => {
    setMode('upcoming');
    setGroup('all');
    setSearchTerm('');
  };

  if (!isOpen) return null;

  const verifiedAt = VERIFIED_DATE_FORMATTER.format(new Date(worldCup2026FixtureMetadata.lastVerifiedAt));

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-cup-fixture-title"
        className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-950 text-white shadow-2xl shadow-black/50 sm:max-w-6xl sm:rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="border-b border-white/10 bg-slate-950/95 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                Mundial FIFA 2026
              </p>
              <h2 id="world-cup-fixture-title" className="mt-1 text-2xl font-black text-white sm:text-3xl">
                Fixture Mundial 2026
              </h2>
              <p className="mt-1 text-sm font-bold text-white/65">
                104 partidos con horarios mostrados en Argentina.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-white/30 hover:bg-white/15"
              aria-label="Cerrar fixture"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-5">
            <WorldCupFixtureSummary now={now} visibleMatches={filteredMatches.length} />

            <WorldCupFixtureFilters
              mode={mode}
              group={group}
              searchTerm={searchTerm}
              onModeChange={setMode}
              onGroupChange={setGroup}
              onSearchTermChange={setSearchTerm}
              onClear={clearFilters}
            />

            {groupedMatches.length > 0 ? (
              <div className="space-y-5">
                {groupedMatches.map((grouped) => (
                  <section key={grouped.dateKey} className="space-y-3">
                    <div className="sticky top-0 z-10 rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-lg shadow-slate-950/30 backdrop-blur">
                      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">
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
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center">
                <p className="text-lg font-black text-white">No hay partidos para mostrar.</p>
                <p className="mt-2 text-sm font-bold text-white/60">
                  Probá limpiar los filtros o cambiar la búsqueda.
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-white/10 bg-slate-950/95 px-5 py-4 text-xs font-bold text-white/55 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Fuente FIFA. Verificado el {verifiedAt}. Horarios convertidos a Argentina ({ARGENTINA_TIME_ZONE}).
            </span>
            <a
              href={worldCup2026FixtureMetadata.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-black text-emerald-300 hover:text-emerald-200"
            >
              Fuente oficial
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </footer>
      </section>
    </div>
  );
}
