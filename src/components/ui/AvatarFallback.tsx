import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

export function AvatarFallback({ src, name, className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const getInitials = (str: string) => {
    const match = str.match(/\b(\w)/g);
    return match ? match.join('').substring(0, 2).toUpperCase() : '??';
  };
  const getColorFromName = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = hash % 360;
    return `hsl(${h}, 70%, 45%)`;
  };
  const hasValidImage = src && !imageError;

  return (
    <div 
      className={cn("relative shrink-0 overflow-hidden flex items-center justify-center font-bold text-white shadow-sm", className)}
      style={{ backgroundColor: !hasValidImage ? getColorFromName(name) : 'transparent' }}
    >
      {hasValidImage ? (
        <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setImageError(true)} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}