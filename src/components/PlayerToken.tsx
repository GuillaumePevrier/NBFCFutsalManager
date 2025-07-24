'use client';

import type { PlayerPosition } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PlayerTokenProps {
  player: PlayerPosition;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isDraggable: boolean;
  isDragging: boolean;
}

const PlayerToken = ({ player, onMouseDown, isDraggable, isDragging }: PlayerTokenProps) => {
  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        'absolute w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-lg select-none transition-all duration-150 ease-in-out',
        'border-2 border-white/50 bg-primary shadow-lg',
        isDraggable ? 'cursor-grab' : 'cursor-default',
        isDragging ? 'cursor-grabbing scale-110 shadow-2xl z-10' : 'hover:scale-105'
      )}
      style={{
        left: `calc(${player.position.x}% - 20px)`, // Offset to center the token
        top: `calc(${player.position.y}% - 20px)`,
        touchAction: 'none' // prevent scrolling on mobile
      }}
      title={player.name}
    >
      {player.avatar}
    </div>
  );
};

export default PlayerToken;
