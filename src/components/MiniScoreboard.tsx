
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

const FoulDisplay = ({ count }: { count: number }) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-neutral-400 hidden sm:inline">Fautes</span>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors',
              i < count ? 'bg-destructive shadow-[0_0_4px_hsl(var(--destructive))]' : 'bg-destructive/20'
            )}
          />
        ))}
      </div>
    </div>
  );


const MiniScoreboard = ({ scoreboard, homeName, opponentName, venue }: MiniScoreboardProps) => {
  const [localTime, setLocalTime] = useState(scoreboard.time);
  
  const homeData = venue === 'home' 
    ? { score: scoreboard.homeScore, fouls: scoreboard.homeFouls } 
    : { score: scoreboard.awayScore, fouls: scoreboard.awayFouls };
    
  const awayData = venue === 'home' 
    ? { score: scoreboard.awayScore, fouls: scoreboard.awayFouls } 
    : { score: scoreboard.homeScore, fouls: scoreboard.homeFouls };

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
      <div className="flex items-center justify-between text-center">
        {/* Home Score & Fouls */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
            <div className="text-2xl sm:text-3xl font-['Orbitron',_sans-serif] text-primary">{homeData.score.toString().padStart(2, '0')}</div>
             <FoulDisplay count={homeData.fouls} />
        </div>

        {/* Timer & Period */}
        <div className="flex flex-col items-center w-24 mx-1">
            <div className={cn(
                "font-bold font-['Orbitron',_sans-serif] text-lg sm:text-xl text-yellow-400", 
                scoreboard.isRunning && 'animate-pulse'
            )}>
                {formatTime(localTime)}
            </div>
            <div className="text-xs font-semibold text-neutral-400">P{scoreboard.period}</div>
        </div>

        {/* Away Score & Fouls */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
            <div className="text-2xl sm:text-3xl font-['Orbitron',_sans-serif] text-primary">{awayData.score.toString().padStart(2, '0')}</div>
            <FoulDisplay count={awayData.fouls} />
        </div>
      </div>
    </div>
  );
};

export default MiniScoreboard;
