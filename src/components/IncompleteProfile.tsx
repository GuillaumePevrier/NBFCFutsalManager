
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getUnlinkedPlayers, linkProfile } from '@/app/actions';
import type { Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, PartyPopper } from 'lucide-react';
import Image from 'next/image';

interface IncompleteProfileProps {
  onProfileLinked: () => void;
}

export default function IncompleteProfile({ onProfileLinked }: IncompleteProfileProps) {
  const [unlinkedPlayers, setUnlinkedPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function fetchPlayers() {
      setIsLoading(true);
      const players = await getUnlinkedPlayers();
      setUnlinkedPlayers(players);
      setIsLoading(false);
    }
    fetchPlayers();
  }, []);

  const handleLinkProfile = async () => {
    if (!selectedPlayerId) {
      toast({ title: 'Oups !', description: 'Veuillez sélectionner votre nom dans la liste.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        toast({ title: 'Erreur', description: 'Utilisateur non trouvé. Veuillez vous reconnecter.', variant: 'destructive' });
        setIsLoading(false);
        return;
    }
    
    const result = await linkProfile(selectedPlayerId, user.id);

    if (result.success) {
        toast({
            title: 'Profil lié !',
            description: 'Bienvenue dans l\'équipe ! Vous êtes maintenant prêt à utiliser l\'application.',
        });
        onProfileLinked();
    } else {
        toast({
            title: 'Erreur',
            description: 'La liaison du profil a échoué. Veuillez réessayer.',
            variant: 'destructive',
        });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-background main-bg">
        <div className="absolute inset-0 w-full h-full -z-10">
         <video 
            src="https://futsal.noyalbrecefc.com/wp-content/uploads/2025/07/telechargement-1.mp4" 
            autoPlay 
            loop 
            muted
            playsInline
            className="w-full h-full object-cover object-center"
         />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>
      <Card className="w-full max-w-md animate-in fade-in-50 zoom-in-90 duration-500">
        <CardHeader className="items-center text-center">
            <Image
                src="https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png"
                alt="Logo du club NBFC Futsal"
                width={100}
                height={100}
                className="w-24 h-24 drop-shadow-lg"
            />
          <CardTitle className="text-2xl flex items-center gap-2">
            <PartyPopper className="text-primary"/>
            Bienvenue dans l'équipe !
          </CardTitle>
          <CardDescription>Pour finaliser votre inscription, trouvez votre nom dans la liste ci-dessous.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={setSelectedPlayerId} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Chargement des joueurs..." : "Qui êtes-vous ?"} />
            </SelectTrigger>
            <SelectContent>
              {unlinkedPlayers.length > 0 ? (
                unlinkedPlayers.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>Aucun profil à lier</SelectItem>
              )}
            </SelectContent>
          </Select>
           <p className="text-xs text-muted-foreground text-center">
                Si votre nom n'apparaît pas, demandez au coach de créer votre profil joueur.
            </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleLinkProfile} disabled={isLoading || !selectedPlayerId} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            C'est bien moi, prêt à jouer !
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    