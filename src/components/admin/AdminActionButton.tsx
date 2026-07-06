import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type AdminActionButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type AdminActionButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface AdminActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: AdminActionButtonVariant;
  size?: AdminActionButtonSize;
}

const variantClasses: Record<AdminActionButtonVariant, string> = {
  primary:
    'border-[#0EA5E9] bg-[#0EA5E9] text-white shadow-[0_8px_18px_rgba(14,165,233,0.20)] hover:bg-sky-500 hover:shadow-[0_12px_22px_rgba(14,165,233,0.24)]',
  secondary:
    'border-[#DDE7F0] bg-white text-[#0F2747] shadow-[0_6px_14px_rgba(8,26,51,0.045)] hover:border-sky-200 hover:bg-[#F6FBFF] hover:text-[#0EA5E9]',
  danger:
    'border-red-100 bg-red-50 text-[#EF4444] shadow-none hover:border-red-200 hover:bg-red-100 hover:text-red-700',
  ghost:
    'border-transparent bg-transparent text-[#64748B] shadow-none hover:bg-[#F6F8FB] hover:text-[#0F2747]',
};

const sizeClasses: Record<AdminActionButtonSize, string> = {
  sm: 'min-h-9 px-3.5 py-2 text-sm',
  md: 'min-h-10 px-4 py-2.5 text-sm',
  lg: 'min-h-10 px-5 py-2.5 text-sm',
  icon: 'h-9 w-9 p-0',
};

export function AdminActionButton({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  disabled,
  ...props
}: AdminActionButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[15px] border font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]/35 disabled:cursor-not-allowed disabled:opacity-55',
        !disabled && 'hover:-translate-y-0.5',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
