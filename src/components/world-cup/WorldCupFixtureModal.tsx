import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { worldCup2026FixtureMetadata } from '../../data/worldCup2026Fixture';
import {
  ARGENTINA_LOCALE,
  ARGENTINA_TIME_ZONE,
  filterWorldCupMatches,
  groupMatchesByArgentinaDate,
} from '../../services/worldCupFixtureService';
import { fifaWorldCupProvider } from '../../services/fifaWorldCupProvider';
import type {
  WorldCupFilterMode,
  WorldCupGroupId,
} from '../../types/worldCup';
import type { WorldCupCenterSection, WorldCupDataSource } from '../../types/worldCupCenter';
import { WorldCupAssistsPanel } from './center/WorldCupAssistsPanel';
import { WorldCupCenterNav } from './center/WorldCupCenterNav';
import { WorldCupDisciplinePanel } from './center/WorldCupDisciplinePanel';
import { WorldCupMatchesPanel } from './center/WorldCupMatchesPanel';
import { WorldCupScorersPanel } from './center/WorldCupScorersPanel';
import { WorldCupStandingsPanel } from './center/WorldCupStandingsPanel';
import { WorldCupTeamsPanel } from './center/WorldCupTeamsPanel';

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

export function WorldCupFixtureModal({ isOpen, onClose }: WorldCupFixtureModalProps) {
  const [activeSection, setActiveSection] = useState<WorldCupCenterSection>('matches');
  const [mode, setMode] = useState<WorldCupFilterMode>('upcoming');
  const [group, setGroup] = useState<WorldCupGroupId | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [matchSource, setMatchSource] = useState<WorldCupDataSource>('local');
  const [matchUpdatedAt, setMatchUpdatedAt] = useState<Date | null>(null);

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

  const loadMatchSource = () => {
    fifaWorldCupProvider
      .getMatches()
      .then(() => {
        setMatchSource('fifa');
        setMatchUpdatedAt(new Date());
      })
      .catch(() => {
        setMatchSource('local');
        setMatchUpdatedAt(null);
      });
  };

  useEffect(() => {
    if (!isOpen) return;
    setActiveSection('matches');
    loadMatchSource();
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

  const renderSection = () => {
    if (activeSection === 'matches') {
      return (
        <WorldCupMatchesPanel
          now={now}
          mode={mode}
          group={group}
          searchTerm={searchTerm}
          visibleMatches={filteredMatches.length}
          groupedMatches={groupedMatches}
          source={matchSource}
          updatedAt={matchUpdatedAt}
          onModeChange={setMode}
          onGroupChange={setGroup}
          onSearchTermChange={setSearchTerm}
          onClear={clearFilters}
          onRetry={loadMatchSource}
        />
      );
    }

    if (activeSection === 'standings') return <WorldCupStandingsPanel />;
    if (activeSection === 'scorers') return <WorldCupScorersPanel />;
    if (activeSection === 'assists') return <WorldCupAssistsPanel />;
    if (activeSection === 'discipline') return <WorldCupDisciplinePanel />;
    return <WorldCupTeamsPanel />;
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#061426]/88 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-cup-fixture-title"
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[32px] border-2 border-[#74ACDF]/75 bg-[#081A33] text-white shadow-[0_28px_120px_rgba(116,172,223,0.34)] sm:max-h-[90vh] sm:max-w-[1120px] sm:rounded-[34px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <style>
          {`
            .golazo-fixture-scroll {
              scrollbar-width: thin;
              scrollbar-color: #74ACDF #081A33;
            }

            .golazo-fixture-scroll::-webkit-scrollbar {
              width: 10px;
            }

            .golazo-fixture-scroll::-webkit-scrollbar-track {
              background: #081A33;
              border-radius: 999px;
            }

            .golazo-fixture-scroll::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, #DDF3FF 0%, #74ACDF 54%, #245A8D 100%);
              border: 2px solid #081A33;
              border-radius: 999px;
            }

            .golazo-fixture-scroll::-webkit-scrollbar-thumb:hover {
              background: #DDF3FF;
            }
          `}
        </style>

        <div aria-hidden="true" className="pointer-events-none absolute inset-[3px] rounded-[28px] border border-white/55 sm:rounded-[30px]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-16 bg-[linear-gradient(90deg,rgba(116,172,223,0.24),rgba(255,255,255,0.14),rgba(116,172,223,0.08),transparent)] sm:w-24" />
          <div className="absolute right-0 top-0 h-full w-16 bg-[linear-gradient(270deg,rgba(116,172,223,0.24),rgba(255,255,255,0.14),rgba(116,172,223,0.08),transparent)] sm:w-24" />
          <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-[#74ACDF]/18 blur-3xl" />
          <div className="absolute -right-28 bottom-16 h-72 w-72 rounded-full bg-[#F6C453]/12 blur-3xl" />
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,228,154,0.14)_0%,rgba(116,172,223,0.10)_24%,transparent_62%)]" />
        </div>

        <div aria-hidden="true" className="relative z-10 grid h-2 shrink-0 grid-cols-[1fr_0.7fr_1fr]">
          <div className="bg-[#74ACDF]" />
          <div className="bg-white" />
          <div className="bg-[#74ACDF]" />
        </div>

        <header className="relative z-10 shrink-0 overflow-hidden border-b border-[#74ACDF]/45 bg-[linear-gradient(135deg,#163B66_0%,#081A33_68%,#0A2547_100%)] px-5 py-5 sm:px-7 sm:py-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute left-8 top-0 h-px w-56 bg-white/70" />
            <div className="absolute right-24 top-4 h-32 w-32 rounded-full bg-[#74ACDF]/18 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-24 w-full bg-[radial-gradient(circle_at_14%_0%,rgba(116,172,223,0.22),transparent_30%),radial-gradient(circle_at_74%_28%,rgba(246,196,83,0.16),transparent_22%)]" />
          </div>

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F6C453]/60 bg-[#F6C453]/14 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFE49A] shadow-[0_0_22px_rgba(246,196,83,0.18)]">
                <span aria-hidden="true">***</span>
                VAMOS ARGENTINA
              </div>
              <h2 id="world-cup-fixture-title" className="text-3xl font-black leading-none tracking-[-0.04em] text-white sm:text-5xl">
                Centro Mundialista 2026
              </h2>
              <p className="mt-2 text-base font-black text-[#DDF3FF] sm:text-lg">
                Vivi el Mundial con pasion argentina
              </p>
              <p className="mt-1 text-sm font-bold text-[#DDF3FF]/78">
                Partidos, posiciones, equipos y estadisticas oficiales
              </p>
            </div>

            <div className="hidden min-w-[210px] items-center justify-end gap-5 pt-2 sm:flex">
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-1.5 text-[#F6C453] drop-shadow-[0_0_14px_rgba(246,196,83,0.45)]">
                  <span className="text-xl leading-none">*</span>
                  <span className="text-2xl leading-none">*</span>
                  <span className="text-xl leading-none">*</span>
                </div>
                <div aria-hidden="true" className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#FFE49A]/60 bg-[#F6C453]/16 shadow-[0_0_36px_rgba(246,196,83,0.24)]">
                  <svg viewBox="0 0 100 100" className="h-16 w-16 text-[#F6C453]" fill="none">
                    <circle cx="50" cy="50" r="14" fill="currentColor" />
                    {Array.from({ length: 16 }).map((_, index) => (
                      <line
                        key={index}
                        x1="50"
                        y1="8"
                        x2="50"
                        y2="24"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        transform={`rotate(${index * 22.5} 50 50)`}
                      />
                    ))}
                    <circle cx="50" cy="50" r="24" stroke="currentColor" strokeWidth="3" opacity="0.55" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#74ACDF]/70 bg-[#081A33]/85 text-white shadow-[0_0_22px_rgba(116,172,223,0.18)] transition hover:border-white hover:bg-[#163B66] focus:outline-none focus:ring-2 focus:ring-[#DDF3FF]"
              aria-label="Cerrar Centro Mundialista"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="golazo-fixture-scroll relative z-10 flex-1 overflow-y-auto bg-[linear-gradient(145deg,rgba(8,26,51,0.98)_0%,rgba(22,59,102,0.94)_46%,rgba(8,26,51,0.98)_100%)] px-5 py-5 sm:px-7">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_8%,rgba(116,172,223,0.16),transparent_30%),radial-gradient(circle_at_100%_28%,rgba(221,243,255,0.10),transparent_28%),radial-gradient(circle_at_50%_102%,rgba(246,196,83,0.10),transparent_26%)]" />
          <div className="relative grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
            <WorldCupCenterNav activeSection={activeSection} onSectionChange={setActiveSection} />
            <main className="min-w-0" tabIndex={-1}>
              {renderSection()}
            </main>
          </div>
        </div>

        <footer className="relative z-10 shrink-0 border-t border-[#74ACDF]/50 bg-[#081A33] px-5 py-4 text-xs font-bold text-[#DDF3FF]/72 sm:px-7">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 grid h-1 grid-cols-[1fr_0.7fr_1fr]">
            <div className="bg-[#74ACDF]" />
            <div className="bg-white" />
            <div className="bg-[#74ACDF]" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="border-l-2 border-[#F6C453]/80 pl-3">
              Fuente oficial FIFA. Verificado el {verifiedAt}. Horarios convertidos a Argentina ({ARGENTINA_TIME_ZONE}).
            </span>
            <a
              href={worldCup2026FixtureMetadata.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#74ACDF]/50 bg-[#245A8D]/55 px-3 py-2 font-black text-white shadow-[0_0_18px_rgba(116,172,223,0.16)] transition hover:border-white hover:bg-[#74ACDF] hover:text-[#081A33]"
            >
              Fuente oficial
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </footer>

        <div aria-hidden="true" className="relative z-10 grid h-2 shrink-0 grid-cols-[1fr_0.7fr_1fr]">
          <div className="bg-[#74ACDF]" />
          <div className="bg-white" />
          <div className="bg-[#74ACDF]" />
        </div>
      </section>
    </div>
  );
}
