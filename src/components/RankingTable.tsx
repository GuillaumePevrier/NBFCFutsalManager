'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Ranking, Opponent, Match } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BarChart3, Medal } from "lucide-react";
import { useState, useEffect } from "react";

const getRankingClass = (rank: number) => {
    switch (rank) {
        case 1: return 'bg-yellow-500/20 hover:bg-yellow-500/30 border-l-4 border-yellow-400'; // Gold
        case 2: return 'bg-gray-400/20 hover:bg-gray-400/30 border-l-4 border-gray-400'; // Silver
        case 3: return 'bg-orange-600/20 hover:bg-orange-600/30 border-l-4 border-orange-500'; // Bronze
        default: return '';
    }
}

interface RankingTableProps {
    opponents: Opponent[];
    matches: Match[];
    competition: string;
}

export default function RankingTable({ opponents, matches, competition }: RankingTableProps) {
    const [rankings, setRankings] = useState<Ranking[]>([]);

    useEffect(() => {
        const calculateNbfcStats = () => {
            const relevantMatches = matches.filter(m => m.details.competition === competition);
            let wins = 0, losses = 0, draws = 0, goalsFor = 0, goalsAgainst = 0;

            relevantMatches.forEach(match => {
                const homeScore = match.scoreboard.homeScore;
                const awayScore = match.scoreboard.awayScore;
                const isNbfcHome = match.details.venue === 'home';

                const nbfcScore = isNbfcHome ? homeScore : awayScore;
                const opponentScore = isNbfcHome ? awayScore : homeScore;

                if(nbfcScore > opponentScore) wins++;
                else if (nbfcScore < opponentScore) losses++;
                else draws++;

                goalsFor += nbfcScore;
                goalsAgainst += opponentScore;
            });
            
            return {
                id: 'nbfc',
                team_name: 'NBFC Futsal',
                logo_url: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png',
                wins, losses, draws, goals_for: goalsFor, goals_against: goalsAgainst,
                championship: competition, // Ensure it's part of the current competition
            };
        };

        const generateRankings = () => {
            // Filter opponents based on the selected competition from their 'championship' field
            const competitionOpponents = opponents.filter(o => o.championship === competition);
            const nbfcStats = calculateNbfcStats();
            
            // Combine NBFC stats with the filtered opponents
            const allTeams = [...competitionOpponents, nbfcStats];

            const calculatedRankings = allTeams.map(team => {
                // Rule: 3 points for a win, 1 for a draw, 0 for a loss
                const points = (team.wins * 3) + (team.draws * 1);
                const played = team.wins + team.losses + team.draws;
                const goalDifference = team.goals_for - team.goals_against;
                
                return {
                    teamId: team.id,
                    teamName: team.team_name,
                    logoUrl: team.logo_url,
                    played,
                    wins: team.wins,
                    draws: team.draws,
                    losses: team.losses,
                    goalsFor: team.goals_for,
                    goalsAgainst: team.goals_against,
                    goalDifference,
                    points,
                };
            }).sort((a, b) => {
                if (a.points !== b.points) return b.points - a.points;
                if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
                if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
                return a.teamName.localeCompare(b.teamName);
            }).map((team, index) => ({
                ...team,
                rank: index + 1,
            }));

            setRankings(calculatedRankings);
        };

        generateRankings();

    }, [opponents, matches, competition]);
    
    const getInitials = (name: string) => name?.[0]?.toUpperCase() || 'O';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 />
                    Classement de la Compétition
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Équipe</TableHead>
                            <TableHead className="text-right">Pts</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">J</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">Diff</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rankings.length > 0 ? (
                            rankings.map((team) => (
                                <TableRow key={team.teamId} className={cn("transition-all duration-300", getRankingClass(team.rank))}>
                                    <TableCell className="font-bold text-lg">{team.rank}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={team.logoUrl} alt={team.teamName} />
                                                <AvatarFallback>{getInitials(team.teamName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm sm:text-base">{team.teamName}</span>
                                                {team.rank <= 3 && (
                                                    <Medal className={cn("w-4 h-4", 
                                                        team.rank === 1 && "text-yellow-400",
                                                        team.rank === 2 && "text-gray-400",
                                                        team.rank === 3 && "text-orange-500"
                                                    )} />
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-lg text-primary">{team.points}</TableCell>
                                    <TableCell className="text-right hidden sm:table-cell">{team.played}</TableCell>
                                    <TableCell className={cn("text-right hidden sm:table-cell font-semibold",
                                        team.goalDifference > 0 && "text-green-500",
                                        team.goalDifference < 0 && "text-red-500"
                                    )}>
                                        {team.goalDifference > 0 && '+'}{team.goalDifference}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Aucun classement disponible pour cette compétition.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
