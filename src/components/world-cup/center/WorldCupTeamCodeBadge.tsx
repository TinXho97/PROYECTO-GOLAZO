type WorldCupTeamCodeBadgeProps = {
  code: string;
  active?: boolean;
};

export function WorldCupTeamCodeBadge({ code, active = false }: WorldCupTeamCodeBadgeProps) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[10px] font-black shadow-inner ${
        active
          ? 'border-[#F6C453]/75 bg-[linear-gradient(135deg,#74ACDF_0%,#FFFFFF_50%,#74ACDF_100%)] text-[#081A33]'
          : 'border-[#74ACDF]/40 bg-[#081A33]/70 text-white'
      }`}
    >
      {code.slice(0, 3)}
    </span>
  );
}
