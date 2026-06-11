import { RotateCcw } from 'lucide-react';
import type { WorldCupDataSource } from '../../../types/worldCupCenter';

type WorldCupSourceBadgeProps = {
  source?: WorldCupDataSource;
  updatedAt?: Date | null;
  onRetry?: () => void;
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function WorldCupSourceBadge({
  source = 'fifa',
  updatedAt,
  onRetry,
}: WorldCupSourceBadgeProps) {
  const sourceLabel = source === 'local' ? 'Datos guardados localmente' : 'Fuente oficial: FIFA';
  const updatedLabel = updatedAt ? `Actualizado ${DATE_FORMATTER.format(updatedAt)}` : 'Sin actualizacion remota';

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[#DDF3FF]/78">
      <span className="rounded-full border border-[#74ACDF]/45 bg-[#081A33]/70 px-3 py-1.5">
        {sourceLabel}
      </span>
      <span className="rounded-full border border-[#74ACDF]/35 bg-[#245A8D]/45 px-3 py-1.5">
        {updatedLabel}
      </span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#F6C453]/55 bg-[#F6C453]/12 px-3 py-1.5 text-[#FFE49A] transition hover:border-[#FFE49A] hover:bg-[#F6C453] hover:text-[#081A33] focus:outline-none focus:ring-2 focus:ring-[#FFE49A]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
