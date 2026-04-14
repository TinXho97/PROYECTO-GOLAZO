import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-500 text-white border-emerald-600 shadow-sm',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-500 text-white border-red-600 shadow-sm',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border', variants[variant], className)}>
      {children}
    </span>
  );
}
