import { cn } from '../../lib/utils';
import { motion, type HTMLMotionProps } from 'motion/react';

interface SkeletonProps extends HTMLMotionProps<'div'> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', repeatType: 'reverse' }}
      className={cn('bg-zinc-200/90 rounded-2xl', className)}
      {...props}
    />
  );
}
