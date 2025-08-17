
'use client';

import { TacticPawn as TacticPawnType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CircleDot } from 'lucide-react';

interface TacticPawnProps {
  pawn: TacticPawnType;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isSelected?: boolean;
}

const TacticPawn = ({ pawn, onClick, onMouseDown, isSelected }: TacticPawnProps) => {

  const baseStyle = "absolute w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg transition-all duration-150";
  
  const typeStyles = {
    player: "bg-primary text-primary-foreground border-2 border-white",
    opponent: "bg-gray-700 text-white border-2 border-gray-300",
    ball: "bg-white text-black border-2 border-black"
  };

  const selectedStyle = isSelected ? 'ring-4 ring-yellow-400 scale-110' : 'cursor-pointer hover:scale-110';

  return (
    <div
      onClick={onClick}
      onMouseDown={onMouseDown}
      className={cn(baseStyle, typeStyles[pawn.type], selectedStyle)}
      style={{
        left: `calc(${pawn.position.x}% - 16px)`, // Center the pawn
        top: `calc(${pawn.position.y}% - 16px)`,
        touchAction: 'none'
      }}
      title={pawn.type}
    >
      {pawn.type === 'ball' ? <CircleDot className="w-5 h-5" /> : pawn.label}
    </div>
  );
};

export default TacticPawn;
