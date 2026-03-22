import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  key?: React.Key;
  onClick?: () => void;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return <div className={cn('px-6 py-4 border-b border-zinc-100 dark:border-zinc-800', className)} {...props}>{children}</div>;
}

export function CardContent({ children, className, ...props }: CardProps) {
  return <div className={cn('px-6 py-4', className)} {...props}>{children}</div>;
}

export function CardFooter({ children, className, ...props }: CardProps) {
  return <div className={cn('px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800', className)} {...props}>{children}</div>;
}
