
'use client';

import { useState } from 'react';
import Header from "@/components/Header";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import type { Role } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function StatsPage() {
    const [role, setRole] = useState<Role>('player');
    const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
    const supabase = createClient();


    const onCoachLogin = () => {
        setRole('coach');
        setIsCoachAuthOpen(false);
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header onCoachClick={() => setIsCoachAuthOpen(true)}>
                <Button asChild variant="outline" size="sm">
                   <Link href="/" className="flex items-center">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Accueil
                   </Link>
                 </Button>
            </Header>
            <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
            <main className="flex-grow p-4 md:p-8 main-bg">
                <div className="w-full max-w-5xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-4">Statistiques et Entraînements</h1>
                    <p className="text-muted-foreground">
                        Cette section est en cours de construction. Bientôt, vous pourrez voir les statistiques détaillées
                        et gérer les présences aux entraînements ici.
                    </p>
                </div>
            </main>
        </div>
    );
}
