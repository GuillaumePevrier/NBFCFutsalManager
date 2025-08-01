
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Users, ArrowLeft, View } from "lucide-react";
import Link from "next/link";
import { getPlayers } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlayerActions } from "./player-actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Player } from "@/lib/types";


export default async function PlayersAdminPage() {
    const supabase = createClient();
    const { data: { session }} = await supabase.auth.getSession();
    const isCoach = !!session;

    const players = await getPlayers();

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground main-bg">
            <header className="p-4 flex items-center justify-between border-b">
                 <Button asChild variant="outline" size="sm">
                   <Link href="/" className="flex items-center">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Retour à l'accueil
                   </Link>
                 </Button>
                 <h1 className="text-xl font-semibold">Effectif du Club</h1>
                 {isCoach ? (
                    <Button asChild size="sm">
                        <Link href="/admin/players/new">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Ajouter un joueur
                        </Link>
                    </Button>
                 ) : (
                    <div className="w-28"></div> // Placeholder for alignment
                 )}
            </header>
            <main className="flex-grow p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users/>
                            Liste des Joueurs ({players.length})
                        </CardTitle>
                        <CardDescription>
                            Consultez les informations et les statistiques de chaque joueur de l'effectif.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Joueur</TableHead>
                                    <TableHead className="hidden md:table-cell">Équipe</TableHead>
                                    <TableHead className="hidden md:table-cell">Poste</TableHead>
                                    <TableHead className="hidden sm:table-cell">Buts</TableHead>
                                    <TableHead className="hidden sm:table-cell">Fautes</TableHead>
                                    <TableHead>
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.length > 0 ? (
                                    players.map((player: Player) => (
                                        <TableRow key={player.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={player.avatar_url} alt={player.name} />
                                                        <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="font-medium">{player.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{player.team}</TableCell>
                                            <TableCell className="hidden md:table-cell">{player.position || 'N/A'}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{player.goals}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{player.fouls}</TableCell>
                                            <TableCell>
                                                {isCoach ? (
                                                    <PlayerActions player={player}/>
                                                ) : (
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/player/${player.id}`}>
                                                            <View className="mr-2 h-4 w-4" />
                                                            Voir la fiche
                                                        </Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            Aucun joueur trouvé. {isCoach && "Commencez par en ajouter un."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

