
'use client';

import type { PlayerPosition } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface PlayerTokenProps {
  player: PlayerPosition;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  isDraggable: boolean;
  isDragging: boolean;
  isSubstitute: boolean;
}

const PlayerToken = ({ player, onMouseDown, onTouchStart, onMouseUp, onTouchEnd, isDraggable, isDragging, isSubstitute }: PlayerTokenProps) => {
  const fallbackInitials = player.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
      className={cn(
        'absolute w-12 h-12 md:w-14 md:h-14 flex items-center justify-center select-none transition-all duration-150 ease-in-out',
        isDraggable ? 'cursor-grab' : 'cursor-pointer',
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
       <div className="absolute -bottom-2.5 flex items-center justify-center gap-1">
        {[...Array(player.goals || 0)].map((_, i) => (
          <span key={`goal_${i}`} className="text-xs" role="img" aria-label="Goal">⚽</span>
        ))}
        {[...Array(player.fouls || 0)].map((_, i) => (
          <span key={`foul_${i}`} className="w-2 h-2 bg-yellow-400 rounded-full border border-black/50" role="img" aria-label="Foul"></span>
        ))}
      </div>
    </div>
  );
};

export default PlayerToken;

