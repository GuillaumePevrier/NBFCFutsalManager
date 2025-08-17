
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Ranking, Opponent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BarChart3, Medal } from "lucide-react";

// Données de classement de démonstration
const demoRankings: Ranking[] = [
  { rank: 1, teamId: "1", teamName: "Futsal La-Chapelle-sur-Erdre", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/la-chapelle-removebg-preview.png", played: 10, wins: 8, draws: 1, losses: 1, goalsFor: 45, goalsAgainst: 20, goalDifference: 25, points: 25 },
  { rank: 2, teamId: "2", teamName: "AS Vigneux Futsal", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/vigneux-removebg-preview.png", played: 10, wins: 7, draws: 2, losses: 1, goalsFor: 38, goalsAgainst: 18, goalDifference: 20, points: 23 },
  { rank: 3, teamId: "nbfc", teamName: "NBFC Futsal", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png", played: 10, wins: 7, draws: 0, losses: 3, goalsFor: 40, goalsAgainst: 30, goalDifference: 10, points: 21 },
  { rank: 4, teamId: "4", teamName: "Celtics Futsal", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/celtics-removebg-preview.png", played: 10, wins: 6, draws: 1, losses: 3, goalsFor: 35, goalsAgainst: 28, goalDifference: 7, points: 19 },
  { rank: 5, teamId: "5", teamName: "US Carquefou Futsal", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/carquefou-removebg-preview.png", played: 10, wins: 5, draws: 1, losses: 4, goalsFor: 33, goalsAgainst: 32, goalDifference: 1, points: 16 },
  { rank: 6, teamId: "6", teamName: "ALPAC Futsal", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/alpac-removebg-preview.png", played: 10, wins: 4, draws: 2, losses: 4, goalsFor: 28, goalsAgainst: 29, goalDifference: -1, points: 14 },
  { rank: 7, teamId: "7", teamName: "Don Bosco Futsal", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/don-bosco-removebg-preview.png", played: 10, wins: 3, draws: 1, losses: 6, goalsFor: 25, goalsAgainst: 35, goalDifference: -10, points: 10 },
  { rank: 8, teamId: "8", teamName: "St-Herblain Pépite Futsal", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/pepite-removebg-preview.png", played: 10, wins: 2, draws: 0, losses: 8, goalsFor: 22, goalsAgainst: 45, goalDifference: -23, points: 6 },
  { rank: 9, teamId: "9", teamName: "Le Mans Futsal", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/le-mans-removebg-preview.png", played: 10, wins: 1, draws: 2, losses: 7, goalsFor: 19, goalsAgainst: 41, goalDifference: -22, points: 5 },
  { rank: 10, teamId: "10", teamName: "Etoile Nantaise", logoUrl: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/etoile-nantaise-removebg-preview.png", played: 10, wins: 1, draws: 0, losses: 9, goalsFor: 18, goalsAgainst: 45, goalDifference: -27, points: 3 },
];

const getRankingClass = (rank: number) => {
    switch (rank) {
        case 1: return 'bg-yellow-500/20 hover:bg-yellow-500/30 border-l-4 border-yellow-400'; // Gold
        case 2: return 'bg-gray-400/20 hover:bg-gray-400/30 border-l-4 border-gray-400'; // Silver
        case 3: return 'bg-orange-600/20 hover:bg-orange-600/30 border-l-4 border-orange-500'; // Bronze
        default: return '';
    }
}

const getRankingBadge = (rank: number) => {
     switch (rank) {
        case 1: return 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90 shadow-[0_0_8px_rgba(250,204,21,0.7)]'; // Gold
        case 2: return 'bg-gray-400 text-gray-900 hover:bg-gray-400/90 shadow-[0_0_8px_rgba(156,163,175,0.7)]'; // Silver
        case 3: return 'bg-orange-500 text-orange-950 hover:bg-orange-500/90 shadow-[0_0_8px_rgba(249,115,22,0.7)]'; // Bronze
        default: return null;
    }
}

interface RankingTableProps {
    opponents: Opponent[];
}

export default function RankingTable({ opponents }: RankingTableProps) {

    const getInitials = (name: string) => name?.[0]?.toUpperCase() || 'O';
    
    // Remplacez demoRankings par les données réelles lorsque vous les aurez
    const rankings = demoRankings;

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
