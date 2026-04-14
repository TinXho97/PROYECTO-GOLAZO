import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-argentina text-zinc-900 hover:opacity-100 hover:shadow-lg hover:-translate-y-0.5 shadow-sm font-black',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 hover:shadow-md hover:-translate-y-0.5',
    outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 hover:shadow-sm hover:-translate-y-0.5',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:-translate-y-0.5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none group relative overflow-hidden',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400/0 via-white/30 to-sky-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      )}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
    </button>
  );
}
