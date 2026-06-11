import { RotateCcw } from 'lucide-react';

type WorldCupErrorStateProps = {
  title?: string;
  detail?: string;
  onRetry: () => void;
};

export function WorldCupErrorState({
  title = 'No pudimos actualizar esta seccion en este momento',
  detail = 'La informacion oficial de FIFA no respondio correctamente.',
  onRetry,
}: WorldCupErrorStateProps) {
  return (
    <div className="rounded-3xl border border-[#F6C453]/45 bg-[#163B66]/65 p-8 text-center shadow-[0_18px_50px_rgba(8,26,51,0.28)]">
      <p className="text-lg font-black text-white">{title}</p>
      <p className="mt-2 text-sm font-bold text-[#DDF3FF]/75">{detail}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#F6C453]/60 bg-[#F6C453]/16 px-5 text-sm font-black text-[#FFE49A] transition hover:border-[#FFE49A] hover:bg-[#F6C453] hover:text-[#081A33] focus:outline-none focus:ring-2 focus:ring-[#FFE49A]"
      >
        <RotateCcw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}
