

'use client';

import React, { forwardRef } from 'react';
import type { TacticPawn as TacticPawnType, TacticArrow } from '@/lib/types';
import TacticPawn from './TacticPawn';

interface FutsalCourtProps {
  children?: React.ReactNode;
  pawns?: TacticPawnType[];
  arrows?: TacticArrow[];
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart?: (event: React.TouchEvent<HTMLDivElement>) => void;
  onPawnClick?: (pawnId: string) => void;
  onPawnMouseDown?: (event: React.MouseEvent<HTMLDivElement>, pawnId: string) => void;
  onPawnTouchStart?: (event: React.TouchEvent<HTMLDivElement>, pawnId: string) => void;
  selectedPawnId?: string | null;
}

const FutsalCourt = forwardRef<HTMLDivElement, FutsalCourtProps>(({ children, pawns, arrows, onMouseDown, onTouchStart, onPawnClick, onPawnMouseDown, onPawnTouchStart, selectedPawnId }, ref) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* Substitutes Bench Area */}
      <div className="w-full max-w-2xl h-16 bg-card border-2 border-border rounded-t-lg flex items-center justify-center px-4 mb-1 shadow-md">
        <span className="text-muted-foreground font-semibold text-sm tracking-widest uppercase">Remplaçants</span>
      </div>

      {/* Main Court */}
      <div
        ref={ref}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="relative w-full max-w-2xl aspect-[2/1] bg-[#a0522d] rounded-lg shadow-2xl border-4 border-white/30 overflow-hidden cursor-crosshair"
      >
        {/* Court Markings first, so they are in the background */}
        <div className="absolute inset-0">
          {/* Center Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30 -translate-x-1/2" />
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-[20%] aspect-square border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />

          {/* Home Goal Area */}
          <div className="absolute top-[20%] bottom-[20%] left-0 w-[15%] border-r-2 border-t-2 border-b-2 border-white/30 rounded-tr-lg rounded-br-lg" />
          {/* Home Penalty Spot */}
          <div className="absolute top-1/2 left-[12%] w-1.5 h-1.5 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
          {/* Home second penalty spot */}
          <div className="absolute top-1/2 left-[25%] w-1.5 h-1.5 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />


          {/* Away Goal Area */}
          <div className="absolute top-[20%] bottom-[20%] right-0 w-[15%] border-l-2 border-t-2 border-b-2 border-white/30 rounded-tl-lg rounded-bl-lg" />
          {/* Away Penalty Spot */}
          <div className="absolute top-1/2 right-[12%] w-1.5 h-1.5 bg-white/30 rounded-full translate-x-1/2 -translate-y-1/2" />
           {/* Away second penalty spot */}
          <div className="absolute top-1/2 right-[25%] w-1.5 h-1.5 bg-white/30 rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
        
        {/* Goals - rendered after markings to be on top */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[-18px] w-5 h-20 bg-card border-2 border-white/30 rounded-r-md overflow-hidden z-10">
            <div className="w-full h-full border-l-4 border-primary"></div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-[-18px] w-5 h-20 bg-card border-2 border-white/30 rounded-l-md overflow-hidden z-10">
            <div className="w-full h-full border-r-4 border-primary"></div>
        </div>

        {/* SVG layer for arrows */}
        <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
           <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
                </marker>
           </defs>
          {arrows?.map(arrow => (
            <line
              key={arrow.id}
              x1={`${arrow.from.x}%`}
              y1={`${arrow.from.y}%`}
              x2={`${arrow.to.x}%`}
              y2={`${arrow.to.y}%`}
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeDasharray={arrow.id === 'preview' ? "4 4" : "none"}
              markerEnd="url(#arrowhead)"
            />
          ))}
        </svg>

        {/* Tactical Pawns */}
        {pawns && pawns.map(pawn => (
          <TacticPawn 
            key={pawn.id} 
            pawn={pawn} 
            onClick={(e) => {
              e.stopPropagation(); // Prevent court click event
              onPawnClick?.(pawn.id);
            }} 
            onMouseDown={(e) => {
                e.stopPropagation();
                onPawnMouseDown?.(e, pawn.id);
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
                onPawnTouchStart?.(e, pawn.id);
            }}
            isSelected={pawn.id === selectedPawnId}
          />
        ))}

        {children}
      </div>
    </div>
  );
});

FutsalCourt.displayName = "FutsalCourt";

export default FutsalCourt;
