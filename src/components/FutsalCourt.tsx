
'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface FutsalCourtProps {
  children: React.ReactNode;
}

const FutsalCourt = forwardRef<HTMLDivElement, FutsalCourtProps>(({ children }, ref) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* Substitutes Bench Area */}
      <div className="w-full max-w-2xl h-16 bg-black/20 rounded-t-lg border-x-2 border-t-2 border-white/10 flex items-center px-4 mb-1">
        <span className="text-white/50 font-semibold text-sm">REMPLAÇANTS</span>
      </div>

      {/* Main Court */}
      <div
        ref={ref}
        className="relative w-full max-w-2xl aspect-[2/1] bg-[#a0522d] rounded-lg shadow-2xl border-4 border-white/30"
      >
        {/* Goals */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[-18px] w-5 h-20 bg-card border-2 border-white/30 rounded-r-md overflow-hidden">
            <div className="w-full h-full border-l-4 border-primary"></div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-[-18px] w-5 h-20 bg-card border-2 border-white/30 rounded-l-md overflow-hidden">
            <div className="w-full h-full border-r-4 border-primary"></div>
        </div>

        {/* Court Markings */}
        <div className="absolute inset-0">
          {/* Center Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30 -translate-x-1/2" />
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-[20%] aspect-square border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />

          {/* Home Goal Area */}
          <div className="absolute top-[20%] bottom-[20%] left-0 w-[15%] border-r-2 border-t-2 border-b-2 border-white/30 rounded-tr-lg rounded-br-lg" />
           {/* Home goal semi-circle */}
          <div className="absolute top-1/2 left-0 w-[24%] aspect-square border-r-2 border-t-2 border-b-2 border-white/30 rounded-full -translate-y-1/2 -translate-x-[50%]" />
          {/* Home Penalty Spot */}
          <div className="absolute top-1/2 left-[12%] w-1.5 h-1.5 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
          {/* Home second penalty spot */}
          <div className="absolute top-1/2 left-[25%] w-1.5 h-1.5 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />


          {/* Away Goal Area */}
          <div className="absolute top-[20%] bottom-[20%] right-0 w-[15%] border-l-2 border-t-2 border-b-2 border-white/30 rounded-tl-lg rounded-bl-lg" />
          {/* Away goal semi-circle */}
          <div className="absolute top-1/2 right-0 w-[24%] aspect-square border-l-2 border-t-2 border-b-2 border-white/30 rounded-full -translate-y-1/2 translate-x-[50%]" />
          {/* Away Penalty Spot */}
          <div className="absolute top-1/2 right-[12%] w-1.5 h-1.5 bg-white/30 rounded-full translate-x-1/2 -translate-y-1/2" />
           {/* Away second penalty spot */}
          <div className="absolute top-1/2 right-[25%] w-1.5 h-1.5 bg-white/30 rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>

        {children}
      </div>
    </div>
  );
});

FutsalCourt.displayName = "FutsalCourt";

export default FutsalCourt;
