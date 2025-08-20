
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, Footprints, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';
import type { Training, Role, Player } from '@/lib/types';
import AuthDialog from '@/components/AuthDialog';
import { useToast } from '@/hooks/use-toast';
import { getTrainings, getPlayers, updateTrainingPoll, incrementPlayerPoints, deleteTraining } from '@/app/actions';
import CreateTrainingDialog from '@/components/CreateTrainingDialog';
import TrainingCard from '@/components/TrainingCard';

export default function TrainingsPage() {
  const supabase = createClient();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>('player');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const trainingsData = await getTrainings();
      const playersData = await getPlayers();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      const upcomingTrainings = trainingsData.filter(t => new Date(t.date) >= today);

      setTrainings(upcomingTrainings);
      setPlayers(playersData);
      setLoading(false);
    };

    fetchData();
     const trainingChannel = supabase
      .channel('public:trainings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainings' },
        (payload) => {
          console.log('Change received!', payload)
          fetchData();
        }
      )
      .subscribe()

    return () => {
        supabase.removeChannel(trainingChannel);
    }
  }, [supabase]);

  useEffect(() => {
    const checkRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setRole(session ? 'coach' : 'player');
    };
    checkRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
        setRole(session ? 'coach' : 'player');
    });

    return () => {
        authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const onAuthenticated = () => {
    setRole('coach');
    setIsAuthOpen(false);
  }

  const handlePollChange = async (trainingId: string, poll: Training['poll']) => {
    const result = await updateTrainingPoll(trainingId, poll);
    if (result.success) {
      setTrainings(prev => prev.map(t => t.id === trainingId ? { ...t, poll } : t));
    } else {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le sondage.", variant: "destructive" });
    }
  };

  const POINTS_FOR_TRAINING = 15;

  const handlePlayerResponse = async (training: Training, playerId: string, newStatus: 'available' | 'unavailable') => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const currentAvailability = training.poll.availabilities.find(a => a.playerId === playerId);

    if (newStatus === 'available' && currentAvailability?.status !== 'available') {
      const result = await incrementPlayerPoints(playerId, POINTS_FOR_TRAINING);
      if (result.success) {
        toast({
          title: "Points de présence attribués !",
          description: `${player.name} a gagné ${POINTS_FOR_TRAINING} points pour sa participation.`
        });
      }
    } else if (newStatus !== 'available' && currentAvailability?.status === 'available') {
       const result = await incrementPlayerPoints(playerId, -POINTS_FOR_TRAINING);
        if (result.success) {
            toast({
                title: "Points de présence retirés",
                description: `${player.name} a perdu ${POINTS_FOR_TRAINING} points.`,
                variant: "destructive"
            });
        }
    }

    const newAvailabilities = training.poll.availabilities.map(a => 
      a.playerId === playerId ? { ...a, status: newStatus } : a
    );
    if (!currentAvailability) {
        newAvailabilities.push({ playerId, status: newStatus });
    }

    await handlePollChange(training.id, { ...training.poll, availabilities: newAvailabilities });
  };
  
  const handleDeleteTraining = async (trainingId: string) => {
      const result = await deleteTraining(trainingId);
      if(result.success) {
          setTrainings(prev => prev.filter(t => t.id !== trainingId));
          toast({ title: "Entraînement supprimé", description: "La session a été annulée."});
      } else {
          toast({ title: "Erreur", description: "La suppression a échoué.", variant: "destructive" });
      }
  }

  const renderContent = () => {
    if (loading) {
      return <p className="text-center text-muted-foreground p-8">Chargement des entraînements...</p>;
    }
    return (
      <div className="space-y-4">
        {trainings.length > 0 ? (
          trainings.map(training => (
            <TrainingCard 
              key={training.id} 
              training={training} 
              allPlayers={players} 
              role={role} 
              onPollChange={(poll) => handlePollChange(training.id, poll)}
              onPlayerResponse={(playerId, status) => handlePlayerResponse(training, playerId, status)}
              onDelete={handleDeleteTraining}
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-lg">
            <Footprints className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Aucun entraînement à venir</h3>
            {role === 'coach' && <p className="mt-1 text-sm">Commencez par créer une nouvelle session.</p>}
          </div>
        )}
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
      <CreateTrainingDialog 
        isOpen={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />

      <main className="flex-grow flex flex-col p-4 md:p-8 main-bg">
        <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Footprints className="w-8 h-8 text-primary" />
              Entraînements à venir
            </h1>
            {role === 'coach' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvel Entraînement
              </Button>
            )}
          </div>
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

    
