import { WorldCupEmptyState } from './WorldCupEmptyState';
import { WorldCupSourceBadge } from './WorldCupSourceBadge';

export function WorldCupAssistsPanel() {
  return (
    <section className="space-y-5">
      <WorldCupSourceBadge updatedAt={null} />
      <WorldCupEmptyState
        badge="Proximamente"
        title="Las asistencias estaran disponibles cuando FIFA publique datos oficiales consistentes."
        detail="No vamos a inferir asistencias ni interpretar campos no validados."
      />
    </section>
  );
}
