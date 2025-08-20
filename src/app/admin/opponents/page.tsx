
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Shield, ArrowLeft, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { getOpponents } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OpponentActions } from "./opponent-actions";
import { createClient } from "@/lib/supabase/client";
import type { Opponent, Role } from "@/lib/types";
import Header from "@/components/Header";
import AuthDialog from '@/components/AuthDialog';
import { useRouter } from 'next/navigation';

export default function OpponentsAdminPage() {
    const [opponents, setOpponents] = useState<Opponent[]>([]);
    const [role, setRole] = useState<Role>('player');
    const [loading, setLoading] = useState(true);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();

     useEffect(() => {
        const fetchOpponents = async () => {
            const data = await getOpponents();
            setOpponents(data);
        };
        fetchOpponents();
    }, []);

    useEffect(() => {
        const checkRoleAndProtect = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            setRole(currentRole);
            if (currentRole !== 'coach') {
                router.push('/');
            }
            setLoading(false);
        };
        checkRoleAndProtect();

        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
            const newRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            setRole(newRole);
            if (newRole !== 'coach') {
                router.push('/');
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [supabase.auth, router]);

    const onAuthenticated = () => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            setRole(currentRole);
        };
        checkRole();
        setIsAuthOpen(false);
    }
    
    const getInitials = (name: string) => name?.[0]?.toUpperCase() || 'O';
    
    if(loading) {
        return (
             <div className="flex flex-col min-h-screen bg-background text-foreground">
                <Header />
                <main className="flex-grow p-4 md:p-8 main-bg flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header onAuthClick={() => setIsAuthOpen(true)}>
                <Button asChild variant="outline" size="sm">
                   <Link href="/" className="flex items-center">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Accueil
                   </Link>
                 </Button>
            </Header>
            <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} onAuthenticated={onAuthenticated} />
            <main className="flex-grow p-4 md:p-8 main-bg">
                <div className="w-full max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold">Équipes Adverses</h1>
                        <Button asChild size="sm">
                            <Link href="/admin/opponents/new">
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Ajouter une équipe
                            </Link>
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield/>
                                Liste des Équipes ({opponents.length})
                            </CardTitle>
                            <CardDescription>
                                Gérez les informations des équipes que vous affrontez.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Équipe</TableHead>
                                        <TableHead className="hidden md:table-cell">Club</TableHead>
                                        <TableHead className="hidden md:table-cell">Championnat</TableHead>
                                        <TableHead className="hidden sm:table-cell">Coach</TableHead>
                                        <TableHead>
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {opponents.length > 0 ? (
                                        opponents.map((opponent: Opponent) => (
                                            <TableRow key={opponent.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={opponent.logo_url} alt={opponent.team_name} />
                                                            <AvatarFallback>{getInitials(opponent.team_name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="font-medium">{opponent.team_name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">{opponent.club_name || 'N/A'}</TableCell>
                                                <TableCell className="hidden md:table-cell">{opponent.championship || 'N/A'}</TableCell>
                                                <TableCell className="hidden sm:table-cell">{opponent.coach_name || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <OpponentActions opponent={opponent}/>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                Aucune équipe trouvée. Commencez par en ajouter une.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
