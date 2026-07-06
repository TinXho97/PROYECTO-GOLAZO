import type { ComponentType } from 'react';
import { cn } from '../../lib/utils';

export interface AdminTabItem<T extends string> {
  id: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

export interface AdminTabsProps<T extends string> {
  tabs: readonly AdminTabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

export function AdminTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: AdminTabsProps<T>) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 rounded-[20px] border border-slate-200/80 bg-[#F6F8FB] p-1.5',
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex min-h-10 flex-1 items-center justify-center gap-2.5 rounded-2xl px-4 py-2 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/35 sm:flex-none',
              isActive
                ? 'bg-white text-[#0F2747] shadow-[0_10px_24px_rgba(8,26,51,0.08)] ring-1 ring-slate-200'
                : 'text-[#64748B] hover:bg-white/70 hover:text-[#0F2747]'
            )}
          >
            {Icon && <Icon className={cn('h-4 w-4', isActive ? 'text-[#0EA5E9]' : 'text-slate-400')} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
