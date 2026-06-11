type WorldCupLoadingStateProps = {
  label?: string;
};

export function WorldCupLoadingState({ label = 'Actualizando datos oficiales de FIFA' }: WorldCupLoadingStateProps) {
  return (
    <div className="rounded-3xl border border-[#74ACDF]/45 bg-[#163B66]/65 p-8 text-center shadow-[0_18px_50px_rgba(8,26,51,0.28)]">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#74ACDF]/30 border-t-[#F6C453]" />
      <p className="text-base font-black text-white">{label}</p>
      <p className="mt-2 text-sm font-bold text-[#DDF3FF]/72">Esto puede tardar unos segundos.</p>
    </div>
  );
}
