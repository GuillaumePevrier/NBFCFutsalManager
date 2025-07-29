
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { getMatches } from './actions';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default async function Home() {

  const createMatch = async () => {
    'use server';
    const supabase = createClient();

    const newMatch = {
      details: {
        opponent: 'Adversaire',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        location: 'Lieu à définir',
        remarks: '',
        matchType: '20min',
      },
      team: [],
      substitutes: [],
      scoreboard: {
        homeScore: 0,
        awayScore: 0,
        homeFouls: 0,
        awayFouls: 0,
        time: 20 * 60, // 20 minutes in seconds
        isRunning: false,
        period: 1,
        timerLastStarted: null,
      },
    };

    const { data, error } = await supabase.from('matches').insert(newMatch).select().single();

    if (error) {
      console.error('Error creating match:', error);
      // Handle error appropriately
      return;
    }
    
    redirect(`/match/${data.id}`);
  };
  
  const matches = await getMatches();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow flex flex-col items-center p-4 md:p-8 main-bg">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Tableau de Bord des Matchs</h1>
            <form action={createMatch}>
              <Button>
                <PlusCircle className="mr-2 h-5 w-5" />
                Nouveau Match
              </Button>
            </form>
          </div>
          
          {matches.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">Aucun match programmé pour le moment.</p>
                <p className="text-muted-foreground mt-2">Cliquez sur "Nouveau Match" pour commencer.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <Card key={match.id} className="hover:border-primary transition-colors duration-200">
                   <CardHeader>
                        <CardTitle className="truncate text-lg">
                            Match vs <span className="text-primary">{match.details.opponent}</span>
                        </CardTitle>
                        <CardDescription>
                            {format(new Date(match.details.date), "EEEE d MMMM yyyy", { locale: fr })} à {match.details.time}
                        </CardDescription>
                    </CardHeader>
                  <CardContent className="flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground mb-4 truncate">{match.details.location}</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/match/${match.id}`} className="flex items-center justify-center">
                        Accéder au match <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
// This is a test comment to create a commit.
