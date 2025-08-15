'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Scoreboard as ScoreboardType } from '@/lib/types';

interface MiniScoreboardProps {
  scoreboard: ScoreboardType;
  homeName: string;
  opponentName: string;
  venue: 'home' | 'away';
}

const MiniScoreboard = ({ scoreboard, homeName, opponentName, venue }: MiniScoreboardProps) => {
  const [localTime, setLocalTime] = useState(scoreboard.time);
  
  const homeScore = venue === 'home' ? scoreboard.homeScore : scoreboard.awayScore;
  const awayScore = venue === 'home' ? scoreboard.awayScore : scoreboard.homeScore;

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (scoreboard.isRunning && scoreboard.timerLastStarted) {
        const serverTime = scoreboard.time;
        const lastStarted = new Date(scoreboard.timerLastStarted).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - lastStarted) / 1000);
        const newTime = Math.max(0, serverTime - elapsed);
        setLocalTime(newTime);
        
        if (newTime > 0) {
            timer = setInterval(() => {
                setLocalTime(prevTime => Math.max(0, prevTime - 1));
            }, 1000);
        }
    } else {
        setLocalTime(scoreboard.time);
    }
    
    return () => clearInterval(timer);
  }, [scoreboard.isRunning, scoreboard.time, scoreboard.timerLastStarted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black/70 border border-primary/30 rounded-lg p-2 text-white shadow-[0_0_10px_hsl(var(--primary)/0.5),inset_0_0_5px_rgba(255,255,255,0.1)]">
      <div className="grid grid-cols-3 items-center text-center">
        {/* Home Score */}
        <div className="flex justify-center items-center">
            <div className="text-2xl font-['Orbitron',_sans-serif] text-primary">{homeScore.toString().padStart(2, '0')}</div>
        </div>

        {/* Timer & Period */}
        <div className="flex flex-col items-center">
            <div className={cn(
                "font-bold font-['Orbitron',_sans-serif] text-lg", 
                scoreboard.isRunning ? 'text-yellow-400 animate-pulse' : 'text-yellow-400/70'
            )}>
                {formatTime(localTime)}
            </div>
            <div className="text-xs font-semibold text-neutral-400">P{scoreboard.period}</div>
        </div>

        {/* Away Score */}
        <div className="flex justify-center items-center">
            <div className="text-2xl font-['Orbitron',_sans-serif] text-primary">{awayScore.toString().padStart(2, '0')}</div>
        </div>
      </div>
    </div>
  );
};

export default MiniScoreboard;
