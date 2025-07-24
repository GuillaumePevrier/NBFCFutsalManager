'use client';

import React, { forwardRef } from 'react';

interface FutsalCourtProps {
  children: React.ReactNode;
}

const FutsalCourt = forwardRef<HTMLDivElement, FutsalCourtProps>(({ children }, ref) => {
  return (
    <div
      ref={ref}
      className="relative w-full max-w-2xl aspect-[2/1] bg-[#0E7A4E] rounded-lg shadow-2xl border-4 border-white/30"
    >
      {/* Court Markings */}
      <div className="absolute inset-0">
        {/* Center Line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white/30 -translate-x-1/2" />
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 w-[20%] aspect-square border-4 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />

        {/* Home Goal Area */}
        <div className="absolute top-[20%] bottom-[20%] left-0 w-[15%] border-r-4 border-t-4 border-b-4 border-white/30 rounded-tr-xl rounded-br-xl" />
        {/* Home Penalty Spot */}
        <div className="absolute top-1/2 left-[12%] w-2 h-2 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />

        {/* Away Goal Area */}
        <div className="absolute top-[20%] bottom-[20%] right-0 w-[15%] border-l-4 border-t-4 border-b-4 border-white/30 rounded-tl-xl rounded-bl-xl" />
        {/* Away Penalty Spot */}
        <div className="absolute top-1/2 right-[12%] w-2 h-2 bg-white/30 rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>

      {children}
    </div>
  );
});

FutsalCourt.displayName = "FutsalCourt";

export default FutsalCourt;
