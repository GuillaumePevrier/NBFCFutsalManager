
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Scoreboard as ScoreboardType } from '@/lib/types';
import { Minus, Pause, Play, Plus, RefreshCw, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FUTSAL_PERIOD_DURATION = 20 * 60; // 20 minutes in seconds

interface ScoreboardProps {
  scoreboard: ScoreboardType;
  onScoreboardChange: (scoreboard: ScoreboardType) => void;
  opponentName: string;
  isCoach: boolean;
}

const Scoreboard = ({ scoreboard, onScoreboardChange, opponentName, isCoach }: ScoreboardProps) => {
  const { toast } = useToast();
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scoreboard.isRunning && scoreboard.time > 0) {
      timer = setInterval(() => {
        onScoreboardChange({ ...scoreboard, time: scoreboard.time - 1 });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [scoreboard, onScoreboardChange]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScoreChange = (team: 'home' | 'away', delta: number) => {
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    const newScore = Math.max(0, scoreboard[key] + delta);
    onScoreboardChange({ ...scoreboard, [key]: newScore });
  };

  const handleFoulChange = (team: 'home' | 'away', delta: number) => {
    const key = team === 'home' ? 'homeFouls' : 'awayFouls';
    const newFouls = Math.max(0, Math.min(5, scoreboard[key] + delta));
    onScoreboardChange({ ...scoreboard, [key]: newFouls });
  };

  const handleTimerToggle = () => {
    onScoreboardChange({ ...scoreboard, isRunning: !scoreboard.isRunning });
  };

  const handleTimerReset = () => {
    onScoreboardChange({
        ...scoreboard,
        time: FUTSAL_PERIOD_DURATION,
        isRunning: false,
    });
    toast({ title: "Chronomètre réinitialisé." });
  };

  const handleFullReset = () => {
     onScoreboardChange({
        homeScore: 0,
        awayScore: 0,
        homeFouls: 0,
        awayFouls: 0,
        time: FUTSAL_PERIOD_DURATION,
        isRunning: false,
        period: 1,
     })
     toast({ title: "Tableau de marque réinitialisé." });
  }

  const ScoreDisplay = ({ score }: { score: number }) => (
    <div className="text-6xl md:text-7xl font-['Orbitron',_sans-serif] text-destructive">
      {score.toString().padStart(2, '0')}
    </div>
  );

  const FoulDisplay = ({ count }: { count: number }) => (
    <div className="flex gap-1 md:gap-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 w-5 md:h-3 md:w-8 rounded-sm',
            i < count ? 'bg-destructive' : 'bg-destructive/20'
          )}
        />
      ))}
    </div>
  );

  return (
    <Card className="w-full max-w-2xl bg-black/80 backdrop-blur-sm border-neutral-700 shadow-lg">
      <div className="flex items-center justify-between p-3 md:p-4 text-white">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <h2 className="text-sm md:text-lg font-bold uppercase tracking-wider text-center">NBFC Futsal</h2>
          <ScoreDisplay score={scoreboard.homeScore} />
          <FoulDisplay count={scoreboard.homeFouls} />
        </div>

        {/* Center Controls */}
        <div className="flex flex-col items-center gap-2 mx-2">
          <div className="text-sm font-semibold text-yellow-400">P{scoreboard.period}</div>
          <div className="text-5xl md:text-6xl font-['Orbitron',_sans-serif] text-yellow-400 font-bold">
            {formatTime(scoreboard.time)}
          </div>
          <div className="text-xs md:text-sm font-semibold uppercase text-neutral-400">Fautes</div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <h2 className="text-sm md:text-lg font-bold uppercase tracking-wider text-center truncate" title={opponentName}>{opponentName}</h2>
          <ScoreDisplay score={scoreboard.awayScore} />
          <FoulDisplay count={scoreboard.awayFouls} />
        </div>
      </div>
      {isCoach && (
        <div className="bg-neutral-900/50 p-2 border-t border-neutral-700">
           <div className="flex justify-center items-center gap-2 md:gap-4 flex-wrap">
                {/* Home Controls */}
                <div className="flex items-center gap-1">
                    <Button onClick={() => handleScoreChange('home', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                    <span className="text-xs w-12 text-center">Score Domicile</span>
                    <Button onClick={() => handleScoreChange('home', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
                </div>
                 <div className="flex items-center gap-1">
                    <Button onClick={() => handleFoulChange('home', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                    <span className="text-xs w-12 text-center">Fautes Domicile</span>
                    <Button onClick={() => handleFoulChange('home', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
                </div>

                {/* Timer Controls */}
                <div className="flex items-center gap-2">
                    <Button onClick={handleTimerToggle} size="sm" variant="secondary" className="h-8 w-8 p-0">
                        {scoreboard.isRunning ? <Pause /> : <Play />}
                    </Button>
                    <Button onClick={handleTimerReset} size="sm" variant="secondary" className="h-8 w-8 p-0"><RefreshCw/></Button>
                </div>

                {/* Away Controls */}
                 <div className="flex items-center gap-1">
                    <Button onClick={() => handleScoreChange('away', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                    <span className="text-xs w-12 text-center">Score Extérieur</span>
                    <Button onClick={() => handleScoreChange('away', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
                </div>
                 <div className="flex items-center gap-1">
                    <Button onClick={() => handleFoulChange('away', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                    <span className="text-xs w-12 text-center">Fautes Extérieur</span>
                    <Button onClick={() => handleFoulChange('away', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
                </div>
                 <Button onClick={handleFullReset} size="sm" variant="destructive" className="h-8 w-8 p-0"><Trophy/></Button>
           </div>
        </div>
      )}
    </Card>
  );
};

export default Scoreboard;
