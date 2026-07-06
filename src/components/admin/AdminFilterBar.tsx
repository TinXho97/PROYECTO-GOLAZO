import type { ChangeEvent, ReactNode } from 'react';
import { Filter, Search } from 'lucide-react';
import type { BookingStatus } from '../../types';
import { cn } from '../../lib/utils';

export interface AdminFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  status: BookingStatus | 'all';
  onStatusChange: (value: BookingStatus | 'all') => void;
  searchPlaceholder?: string;
  resultLabel?: ReactNode;
  className?: string;
}

const statusOptions: Array<{ value: BookingStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'completed', label: 'Finalizadas' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: 'no_show', label: 'No show' },
];

export function AdminFilterBar({
  searchTerm,
  onSearchTermChange,
  status,
  onStatusChange,
  searchPlaceholder = 'Buscar',
  resultLabel,
  className,
}: AdminFilterBarProps) {
  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(event.target.value as BookingStatus | 'all');
  };

  return (
    <section
      className={cn(
        'rounded-[20px] border border-[#DDE7F0] bg-[#F8FBFF] p-3 shadow-[0_8px_20px_rgba(8,26,51,0.04)]',
        className
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-[15px] border border-[#DDE7F0] bg-white pl-11 pr-4 text-sm font-medium text-[#0F2747] outline-none transition placeholder:text-slate-400 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/15"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block min-w-[210px]">
            <span className="sr-only">Filtrar por estado</span>
            <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <select
              className="h-11 w-full appearance-none rounded-[15px] border border-[#DDE7F0] bg-white pl-10 pr-9 text-sm font-semibold text-[#0F2747] outline-none transition focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/15"
              value={status}
              onChange={handleStatusChange}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {resultLabel && (
            <div className="rounded-[15px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#64748B]">
              {resultLabel}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
