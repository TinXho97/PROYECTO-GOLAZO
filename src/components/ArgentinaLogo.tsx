import React from 'react';
import { Star, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

interface ArgentinaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const ArgentinaLogo = ({ size = 'md', showText = true, className }: ArgentinaLogoProps) => {
  const iconSize = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-10 h-10' : 'w-6 h-6';
  const textSize = size === 'lg' ? 'text-6xl' : size === 'md' ? 'text-3xl' : 'text-lg';
  const containerSize = size === 'lg' ? 'w-28 h-28' : size === 'md' ? 'w-16 h-16' : 'w-11 h-11';

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className={cn(
        containerSize,
        "bg-gradient-to-br from-sky-400 via-white to-sky-500 rounded-2xl flex flex-col items-center justify-center shadow-xl relative overflow-hidden border-2 border-white"
      )}>
        {/* Three Stars */}
        <div className="flex gap-1 mb-[-2px] z-20">
          <Star className={cn(size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3 h-3' : 'w-2 h-2', "text-yellow-400 fill-yellow-400")} />
          <Star className={cn(size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3 h-3' : 'w-2 h-2', "text-yellow-400 fill-yellow-400 -mt-1")} />
          <Star className={cn(size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3 h-3' : 'w-2 h-2', "text-yellow-400 fill-yellow-400")} />
        </div>
        
        <Trophy className={cn(iconSize, "text-yellow-500 z-10")} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            textSize,
            "font-black tracking-tighter text-sky-600"
          )}>
            GOLAZO
          </span>
          <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-sky-200 to-sky-400 rounded-full" />
        </div>
      )}
    </div>
  );
};
