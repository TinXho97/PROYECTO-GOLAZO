import {
  CalendarDays,
  Handshake,
  ListOrdered,
  ShieldAlert,
  Trophy,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WorldCupCenterSection } from '../../../types/worldCupCenter';

type WorldCupCenterNavProps = {
  activeSection: WorldCupCenterSection;
  onSectionChange: (section: WorldCupCenterSection) => void;
};

const ITEMS: Array<{
  id: WorldCupCenterSection;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'matches', label: 'Partidos', icon: CalendarDays },
  { id: 'standings', label: 'Posiciones', icon: ListOrdered },
  { id: 'scorers', label: 'Goleadores', icon: Trophy },
  { id: 'assists', label: 'Asistencias', icon: Handshake },
  { id: 'discipline', label: 'Disciplina', icon: ShieldAlert },
  { id: 'teams', label: 'Equipos', icon: Users },
];

export function WorldCupCenterNav({ activeSection, onSectionChange }: WorldCupCenterNavProps) {
  return (
    <nav
      aria-label="Secciones del Centro Mundialista"
      className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-3xl border border-[#74ACDF]/45 bg-[#DDF3FF]/12 p-2 backdrop-blur-xl lg:top-5 lg:mx-0 lg:self-start lg:overflow-visible"
    >
      <div className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeSection;

          return (
            <button
              key={item.id}
              type="button"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSectionChange(item.id)}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-[#FFE49A] lg:justify-start ${
                isActive
                  ? 'border-[#DDF3FF] bg-[#245A8D] text-white shadow-[0_0_24px_rgba(116,172,223,0.30)]'
                  : 'border-[#74ACDF]/35 bg-white/88 text-[#081A33] hover:border-[#DDF3FF] hover:bg-[#DDF3FF]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
