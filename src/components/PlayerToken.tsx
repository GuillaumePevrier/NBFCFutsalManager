'use client';

import type { PlayerPosition } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface PlayerTokenProps {
  player: PlayerPosition;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isDraggable: boolean;
  isDragging: boolean;
  isSubstitute: boolean;
}

const PlayerToken = ({ player, onMouseDown, isDraggable, isDragging, isSubstitute }: PlayerTokenProps) => {
  const fallbackInitials = player.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        'absolute w-12 h-12 md:w-14 md:h-14 flex items-center justify-center select-none transition-all duration-150 ease-in-out',
        isDraggable ? 'cursor-grab' : 'cursor-default',
        isDragging ? 'cursor-grabbing scale-110 z-10' : 'hover:scale-105'
      )}
      style={{
        left: `calc(${player.position.x}% - 24px)`, // Offset to center the token
        top: `calc(${player.position.y}% - 24px)`,
        touchAction: 'none' // prevent scrolling on mobile
      }}
      title={player.name}
    >
      <Avatar className="w-full h-full border-2 border-white/80 shadow-lg">
        <AvatarImage src={player.avatar_url} alt={player.name} className="object-cover" />
        <AvatarFallback className={cn(
          'text-lg font-bold text-white',
          isSubstitute ? 'bg-secondary' : 'bg-primary'
        )}>
          {fallbackInitials}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default PlayerToken;
