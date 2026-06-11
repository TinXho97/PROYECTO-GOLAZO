type WorldCupEmptyStateProps = {
  title: string;
  detail?: string;
  badge?: string;
};

export function WorldCupEmptyState({ title, detail, badge }: WorldCupEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-[#74ACDF]/45 bg-[#163B66]/65 p-8 text-center shadow-[0_18px_50px_rgba(8,26,51,0.28)]">
      {badge ? (
        <span className="mb-4 inline-flex rounded-full border border-[#F6C453]/60 bg-[#F6C453]/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE49A]">
          {badge}
        </span>
      ) : null}
      <p className="text-lg font-black text-white">{title}</p>
      {detail ? <p className="mt-2 text-sm font-bold text-[#DDF3FF]/75">{detail}</p> : null}
    </div>
  );
}
