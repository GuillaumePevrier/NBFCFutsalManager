
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Scoreboard as ScoreboardType, MatchDetails, Player, PlayerPosition } from '@/lib/types';
import { Minus, Pause, Play, Plus, RefreshCw, Trophy, Expand, Shrink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PlayerSelectionDialog from './PlayerSelectionDialog';
import { updatePlayerStats } from '@/app/actions';

interface ScoreboardProps {
  scoreboard: ScoreboardType;
  details: MatchDetails;
  onScoreboardChange: (scoreboard: ScoreboardType, eventInfo?: { type: 'goal' | 'foul', player: Player}) => void;
  isCoach: boolean;
  playersOnField: PlayerPosition[];
}

const Scoreboard = ({ scoreboard, details, onScoreboardChange, isCoach, playersOnField }: ScoreboardProps) => {
  const { toast } = useToast();
  const [localTime, setLocalTime] = useState(scoreboard.time);
  const periodDuration = (details.matchType === '25min' ? 25 : 20) * 60;
  const [dialogState, setDialogState] = useState<{ open: boolean, type: 'goal' | 'foul', team: 'home' | 'away' }>({ open: false, type: 'goal', team: 'home' });
  const [isFullScreen, setIsFullScreen] = useState(false);

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
  }, [scoreboard]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStatChange = (team: 'home' | 'away', type: 'goal' | 'foul', delta: number) => {
    if (!isCoach) return;
    
    if ((type === 'goal' || type === 'foul') && delta > 0 && team === 'home') {
        setDialogState({ open: true, type, team });
    } else {
        // For away team or decreasing stats, update directly
        const scoreKey = type === 'goal' ? (team === 'home' ? 'homeScore' : 'awayScore') : null;
        const foulKey = type === 'foul' ? (team === 'home' ? 'homeFouls' : 'awayFouls') : null;

        let updatedScoreboard = { ...scoreboard, time: localTime };
        
        if (scoreKey) {
            const oldScore = updatedScoreboard[scoreKey];
            updatedScoreboard = {...updatedScoreboard, [scoreKey]: Math.max(0, oldScore + delta) };
        }
        if (foulKey) {
            const oldFouls = updatedScoreboard[foulKey];
             updatedScoreboard = {...updatedScoreboard, [foulKey]: Math.max(0, Math.min(5, oldFouls + delta)) };
        }
        onScoreboardChange(updatedScoreboard);
    }
  };

  const handlePlayerSelected = async (player: Player) => {
    const { type } = dialogState;
    setDialogState({ ...dialogState, open: false });

    let updatedScoreboard = { ...scoreboard, time: localTime };
    let eventInfo: { type: 'goal' | 'foul', player: Player } | undefined = undefined;

    if (type === 'goal') {
        updatedScoreboard.homeScore += 1;
        toast({ title: "But !", description: `${player.name} a marqué.` });
    } else if (type === 'foul') {
        updatedScoreboard.homeFouls = Math.min(5, updatedScoreboard.homeFouls + 1);
        toast({ title: "Faute", description: `Faute commise par ${player.name}.` });
    }

    // Update player stats in the database
    await updatePlayerStats({ 
        playerId: player.id, 
        goals: type === 'goal' ? 1 : 0, 
        fouls: type === 'foul' ? 1 : 0 
    });

    eventInfo = { type, player };
    onScoreboardChange(updatedScoreboard, eventInfo);
  };


  const handleTimerToggle = () => {
    if (!isCoach) return;
    const nowIsRunning = !scoreboard.isRunning;
    const newTime = nowIsRunning ? localTime : Math.max(0, localTime);
    
    onScoreboardChange({ 
        ...scoreboard, 
        time: newTime, 
        isRunning: nowIsRunning,
        timerLastStarted: nowIsRunning ? new Date().toISOString() : null
    });
  };

  const handleTimerReset = () => {
    if (!isCoach) return;
    setLocalTime(periodDuration);
    onScoreboardChange({
        ...scoreboard,
        time: periodDuration,
        isRunning: false,
        timerLastStarted: null
    });
    toast({ title: "Chronomètre réinitialisé." });
  };
  
  const handleNextPeriod = () => {
    if(!isCoach) return;
    setLocalTime(periodDuration);
    onScoreboardChange({
      ...scoreboard,
      time: periodDuration,
      isRunning: false,
      timerLastStarted: null,
      period: scoreboard.period === 1 ? 2 : 1,
      homeFouls: 0,
      awayFouls: 0,
    });
    toast({ title: `Début de la période ${scoreboard.period === 1 ? 2 : 1}. Fautes remises à zéro.` });
  }

  const handleFullReset = () => {
    if (!isCoach) return;
     setLocalTime(periodDuration);
     onScoreboardChange({
        homeScore: 0,
        awayScore: 0,
        homeFouls: 0,
        awayFouls: 0,
        time: periodDuration,
        isRunning: false,
        period: 1,
        timerLastStarted: null
     })
     toast({ title: "Tableau de marque réinitialisé." });
  }

  const ScoreDisplay = ({ score }: { score: number }) => (
    <div className="text-5xl sm:text-6xl md:text-7xl font-['Orbitron',_sans-serif] text-destructive">
      {score.toString().padStart(2, '0')}
    </div>
  );

  const FoulDisplay = ({ count }: { count: number }) => (
    <div className="flex gap-1 md:gap-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 w-4 md:h-3 md:w-8 rounded-sm',
            i < count ? 'bg-destructive' : 'bg-destructive/20'
          )}
        />
      ))}
    </div>
  );

  return (
    <>
    <PlayerSelectionDialog 
      isOpen={dialogState.open}
      onOpenChange={(open) => setDialogState({ ...dialogState, open })}
      players={playersOnField}
      onPlayerSelect={handlePlayerSelected}
      title={dialogState.type === 'goal' ? 'Qui a marqué ?' : 'Qui a fait la faute ?'}
    />
    <div className={cn(
        "w-full max-w-2xl transition-all duration-300",
        isFullScreen && "fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
    )}>
        <Card className={cn(
            "w-full bg-black/80 backdrop-blur-sm border-neutral-700 shadow-lg relative",
             isFullScreen && "w-[95%] max-w-4xl scale-110 transform"
        )}>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 text-white/50 hover:text-white hover:bg-white/10 z-10"
                onClick={() => setIsFullScreen(!isFullScreen)}
            >
                {isFullScreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
            </Button>

            <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 text-white">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
                <h2 className="text-xs sm:text-sm md:text-lg font-bold uppercase tracking-wider text-center">NBFC Futsal</h2>
                <ScoreDisplay score={scoreboard.homeScore} />
                <FoulDisplay count={scoreboard.homeFouls} />
                </div>

                {/* Center Controls */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 mx-2">
                <div className="text-xs sm:text-sm font-semibold text-yellow-400">P{scoreboard.period}</div>
                <div className="text-4xl sm:text-5xl md:text-6xl font-['Orbitron',_sans-serif] text-yellow-400 font-bold">
                    {formatTime(localTime)}
                </div>
                <div className="text-xs font-semibold uppercase text-neutral-400">Fautes</div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
                <h2 className="text-xs sm:text-sm md:text-lg font-bold uppercase tracking-wider text-center truncate" title={details.opponent}>{details.opponent}</h2>
                <ScoreDisplay score={scoreboard.awayScore} />
                <FoulDisplay count={scoreboard.awayFouls} />
                </div>
            </div>
            {isCoach && (
                <div className="bg-neutral-900/50 p-2 border-t border-neutral-700">
                <div className="grid grid-cols-3 gap-2">
                        {/* Left Controls (Home) */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1">
                            <Button onClick={() => handleStatChange('home', 'goal', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                                <span className="text-xs w-10 text-center">Score</span>
                            <Button onClick={() => handleStatChange('home', 'goal', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
                            </div>
                            <div className="flex items-center gap-1">
                            <Button onClick={() => handleStatChange('home', 'foul', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                                <span className="text-xs w-10 text-center">Fautes</span>
                            <Button onClick={() => handleStatChange('home', 'foul', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
                            </div>
                        </div>

                        {/* Center Timer Controls */}
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-2">
                                <Button onClick={handleTimerToggle} size="sm" variant="secondary" className="h-8 w-8 p-0">
                                    {scoreboard.isRunning ? <Pause /> : <Play />}
                                </Button>
                                <Button onClick={handleTimerReset} size="sm" variant="secondary" className="h-8 w-8 p-0"><RefreshCw/></Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={handleNextPeriod} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8">Période Suiv.</Button>
                                <Button onClick={handleFullReset} size="sm" variant="destructive" className="h-8 w-8 p-0"><Trophy/></Button>
                            </div>
                        </div>

                        {/* Right Controls (Away) */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1">
                                <Button onClick={() => handleStatChange('away', 'goal', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                                <span className="text-xs w-10 text-center">Score</span>
                                <Button onClick={() => handleStatChange('away', 'goal', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button onClick={() => handleStatChange('away', 'foul', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                                <span className="text-xs w-10 text-center">Fautes</span>
                                <Button onClick={() => handleStatChange('away', 'foul', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
                            </div>
                        </div>
                </div>
                </div>
            )}
        </Card>
    </div>
    </>
  );
};

export default Scoreboard;

    