
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Scoreboard as ScoreboardType } from '@/lib/types';

interface MiniScoreboardProps {
  scoreboard: ScoreboardType;
  opponentName: string;
}

const MiniScoreboard = ({ scoreboard, opponentName }: MiniScoreboardProps) => {
  const [localTime, setLocalTime] = useState(scoreboard.time);

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
    <div className="bg-black/80 border border-neutral-700 rounded-md p-2 text-white">
      <div className="flex items-center justify-center gap-3">
        {/* Home Score */}
        <div className="flex-1 text-center">
            <div className="text-xs font-semibold uppercase truncate" title="NBFC Futsal">NBFC</div>
            <div className="text-2xl font-['Orbitron',_sans-serif] text-destructive">{scoreboard.homeScore.toString().padStart(2, '0')}</div>
        </div>

        {/* Timer & Period */}
        <div className="text-center">
            <div className="text-xs font-semibold text-yellow-400">P{scoreboard.period}</div>
            <div className="text-2xl font-['Orbitron',_sans-serif] text-yellow-400 font-bold">
                {formatTime(localTime)}
            </div>
        </div>

        {/* Away Score */}
        <div className="flex-1 text-center">
            <div className="text-xs font-semibold uppercase truncate" title={opponentName}>{opponentName.substring(0,4)}</div>
            <div className="text-2xl font-['Orbitron',_sans-serif] text-destructive">{scoreboard.awayScore.toString().padStart(2, '0')}</div>
        </div>
      </div>
    </div>
  );
};

export default MiniScoreboard;
