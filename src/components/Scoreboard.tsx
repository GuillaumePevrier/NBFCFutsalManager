
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Scoreboard as ScoreboardType, MatchDetails, Player, PlayerPosition } from '@/lib/types';
import { Minus, Pause, Play, Plus, RefreshCw, Trophy, Expand, Shrink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PlayerSelectionDialog from './PlayerSelectionDialog';

interface ScoreboardProps {
  scoreboard: ScoreboardType;
  details: MatchDetails;
  onScoreboardChange: (scoreboard: ScoreboardType) => void;
  onGoalScored: (player: Player) => void;
  onFoulCommitted: (player: Player) => void;
  isCoach: boolean;
  playersOnField: PlayerPosition[];
}

const Scoreboard = ({ 
    scoreboard, 
    details, 
    onScoreboardChange, 
    onGoalScored,
    onFoulCommitted,
    isCoach, 
    playersOnField 
}: ScoreboardProps) => {
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
  
  const handleStatChange = (team: 'home' | 'away', type: 'score' | 'foul', delta: number) => {
    if (!isCoach) return;
    
    if (type === 'score' && delta > 0 && team === 'home') {
        if (playersOnField.length === 0) {
            toast({ title: "Action impossible", description: "Ajoutez des joueurs sur le terrain avant d'attribuer un but.", variant: "destructive"});
            return;
        }
        setDialogState({ open: true, type: 'goal', team });
        return;
    }
     if (type === 'foul' && delta > 0 && team === 'home') {
        if (playersOnField.length === 0) {
            toast({ title: "Action impossible", description: "Ajoutez des joueurs sur le terrain avant d'attribuer une faute.", variant: "destructive"});
            return;
        }
        setDialogState({ open: true, type: 'foul', team });
        return;
    }

    let updatedScoreboard = { ...scoreboard, time: localTime };
    if (type === 'score') {
        const key = team === 'home' ? 'homeScore' : 'awayScore';
        updatedScoreboard[key] = Math.max(0, updatedScoreboard[key] + delta);
    } else if (type === 'foul') {
        const key = team === 'home' ? 'homeFouls' : 'awayFouls';
        updatedScoreboard[key] = Math.max(0, Math.min(5, updatedScoreboard[key] + delta));
    }
    onScoreboardChange(updatedScoreboard);
  };

  const handlePlayerSelected = (player: Player) => {
    const { type } = dialogState;
    setDialogState({ ...dialogState, open: false });

    if (type === 'goal') {
        onGoalScored(player);
    } else if (type === 'foul') {
        onFoulCommitted(player);
    }
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

  const ScoreDisplay = ({ score, isFullScreen }: { score: number, isFullScreen?: boolean }) => (
    <div className={cn(
        "font-['Orbitron',_sans-serif] text-destructive",
        isFullScreen ? "text-8xl" : "text-5xl sm:text-6xl md:text-7xl"
    )}>
      {score.toString().padStart(2, '0')}
    </div>
  );

  const FoulDisplay = ({ count, isFullScreen }: { count: number, isFullScreen?: boolean }) => (
    <div className={cn(
        "flex gap-1 md:gap-2",
        isFullScreen && "gap-3"
        )}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-sm',
            i < count ? 'bg-destructive' : 'bg-destructive/20',
             isFullScreen ? "h-4 w-12" : "h-2 w-4 md:h-3 md:w-8"
          )}
        />
      ))}
    </div>
  );

  const renderContent = () => (
    <>
      {/* Home Team */}
      <div className={cn("flex flex-col items-center flex-1", isFullScreen ? "justify-around p-4" : "gap-1 sm:gap-2")}>
        <h2 className={cn("font-bold uppercase tracking-wider text-center", isFullScreen ? "text-2xl" : "text-xs sm:text-sm md:text-lg")} >NBFC Futsal</h2>
        <ScoreDisplay score={scoreboard.homeScore} isFullScreen={isFullScreen} />
        <div className="flex flex-col items-center gap-2">
            <FoulDisplay count={scoreboard.homeFouls} isFullScreen={isFullScreen} />
            {isCoach && isFullScreen && (
                <div className="flex items-center gap-4 mt-4">
                    <Button onClick={() => handleStatChange('home', 'score', -1)} size="lg" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-16 w-16 text-2xl"><Minus/></Button>
                    <span className="text-lg w-20 text-center font-semibold">Score</span>
                    <Button onClick={() => handleStatChange('home', 'score', 1)} size="lg" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-16 w-16 text-2xl"><Plus/></Button>
                </div>
            )}
             {isCoach && isFullScreen && (
                <div className="flex items-center gap-4">
                    <Button onClick={() => handleStatChange('home', 'foul', -1)} size="lg" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-16 w-16 text-2xl"><Minus/></Button>
                    <span className="text-lg w-20 text-center font-semibold">Fautes</span>
                    <Button onClick={() => handleStatChange('home', 'foul', 1)} size="lg" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-16 w-16 text-2xl"><Plus/></Button>
                </div>
            )}
        </div>
      </div>

      {/* Center Controls */}
      <div className={cn("flex flex-col items-center mx-2", isFullScreen ? "justify-around p-4" : "gap-1 sm:gap-2")}>
        <div className={cn("font-semibold text-yellow-400", isFullScreen ? "text-2xl" : "text-xs sm:text-sm")}>P{scoreboard.period}</div>
        <div className={cn("font-['Orbitron',_sans-serif] text-yellow-400 font-bold", isFullScreen ? "text-8xl" : "text-4xl sm:text-5xl md:text-6xl")}>
            {formatTime(localTime)}
        </div>
        <div className={cn("font-semibold uppercase text-neutral-400", isFullScreen ? "text-lg" : "text-xs")}>Fautes</div>
         {isCoach && isFullScreen && (
            <div className="flex flex-col items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-4">
                    <Button onClick={handleTimerToggle} size="lg" variant="secondary" className="h-16 w-16">
                        {scoreboard.isRunning ? <Pause size={32} /> : <Play size={32} />}
                    </Button>
                    <Button onClick={handleTimerReset} size="lg" variant="secondary" className="h-16 w-16"><RefreshCw size={32}/></Button>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={handleNextPeriod} size="lg" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-16 text-base px-6">Période Suiv.</Button>
                    <Button onClick={handleFullReset} size="lg" variant="destructive" className="h-16 w-16"><Trophy size={32}/></Button>
                </div>
            </div>
        )}
      </div>

      {/* Away Team */}
      <div className={cn("flex flex-col items-center flex-1", isFullScreen ? "justify-around p-4" : "gap-1 sm:gap-2")}>
        <h2 className={cn("font-bold uppercase tracking-wider text-center truncate", isFullScreen ? "text-2xl" : "text-xs sm:text-sm md:text-lg")} title={details.opponent}>{details.opponent}</h2>
        <ScoreDisplay score={scoreboard.awayScore} isFullScreen={isFullScreen} />
         <div className="flex flex-col items-center gap-2">
            <FoulDisplay count={scoreboard.awayFouls} isFullScreen={isFullScreen} />
            {isCoach && isFullScreen && (
                <div className="flex items-center gap-4 mt-4">
                    <Button onClick={() => handleStatChange('away', 'score', -1)} size="lg" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-16 w-16 text-2xl"><Minus/></Button>
                    <span className="text-lg w-20 text-center font-semibold">Score</span>
                    <Button onClick={() => handleStatChange('away', 'score', 1)} size="lg" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-16 w-16 text-2xl"><Plus/></Button>
                </div>
            )}
             {isCoach && isFullScreen && (
                <div className="flex items-center gap-4">
                    <Button onClick={() => handleStatChange('away', 'foul', -1)} size="lg" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-16 w-16 text-2xl"><Minus/></Button>
                    <span className="text-lg w-20 text-center font-semibold">Fautes</span>
                    <Button onClick={() => handleStatChange('away', 'foul', 1)} size="lg" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-16 w-16 text-2xl"><Plus/></Button>
                </div>
            )}
        </div>
      </div>
    </>
  )

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
        isFullScreen && "fixed inset-0 z-50 flex items-center justify-center bg-background"
    )}>
        <Card className={cn(
            "w-full bg-black/80 backdrop-blur-sm border-neutral-700 shadow-lg relative",
             isFullScreen ? "w-full h-full rounded-none border-0 flex flex-col md:flex-row" : "max-w-4xl"
        )}>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 text-white/50 hover:text-white hover:bg-white/10 z-20"
                onClick={() => setIsFullScreen(!isFullScreen)}
            >
                {isFullScreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
            </Button>
            
            <div className={cn("flex text-white", isFullScreen ? "flex-grow flex-col md:flex-row" : "items-center justify-between p-2 sm:p-3 md:p-4")}>
                {renderContent()}
            </div>

            {isCoach && !isFullScreen && (
                <div className="bg-neutral-900/50 p-2 border-t border-neutral-700">
                <div className="grid grid-cols-3 gap-2">
                        {/* Left Controls (Home) */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1">
                            <Button onClick={() => handleStatChange('home', 'score', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                                <span className="text-xs w-10 text-center">Score</span>
                            <Button onClick={() => handleStatChange('home', 'score', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
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
                                <Button onClick={() => handleStatChange('away', 'score', -1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Minus/></Button>
                                <span className="text-xs w-10 text-center">Score</span>
                                <Button onClick={() => handleStatChange('away', 'score', 1)} size="sm" variant="outline" className="text-white border-neutral-600 hover:bg-neutral-700 h-8 w-8 p-0"><Plus/></Button>
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
