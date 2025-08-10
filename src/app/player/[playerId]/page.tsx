
import { getPlayerById } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Star, Target } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface StatRowProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    barValue?: number;
    barColorClass: string;
}

const StatRow = ({ icon: Icon, label, value }: StatRowProps) => (
  <div className="flex items-center gap-4 text-card-foreground">
    <Icon className="w-5 h-5 text-primary" />
    <span className="font-semibold text-sm flex-1">{label}</span>
    <span className="text-xl font-bold">{value}</span>
  </div>
);


export default async function PlayerPage({ params }: { params: { playerId: string } }) {
  const player = await getPlayerById(params.playerId);

  if (!player) {
    notFound();
  }
  
  const fallbackInitials = player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground main-bg">
        <Header>
            <Button asChild variant="outline" size="sm">
                <Link href="/admin/players" className="flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Effectif
                </Link>
            </Button>
        </Header>
        <main className="flex-grow flex items-center justify-center p-4">
            <Card className="w-full max-w-sm mx-auto bg-gradient-to-br from-card to-background border-2 border-primary/20 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent relative">
                   <div 
                        className="absolute inset-0 bg-cover bg-center opacity-10" 
                        style={{ backgroundImage: "url('https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png')" }}
                    />
                    <div className="flex flex-col items-center gap-4 relative">
                        <Avatar className="w-32 h-32 border-4 border-accent shadow-lg">
                            <AvatarImage src={player.avatar_url} alt={player.name} className="object-cover" />
                            <AvatarFallback className="text-5xl bg-primary text-primary-foreground">{fallbackInitials}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-card-foreground tracking-tight">{player.name}</h1>
                            <p className="text-lg font-semibold text-primary">{player.position || 'Non spécifié'}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6 space-y-5">
                    <div className="flex justify-around text-center text-card-foreground">
                        <div>
                            <p className="text-sm text-muted-foreground">Équipe</p>
                            <p className="font-bold text-lg">{player.team}</p>
                        </div>
                        <Separator orientation="vertical" className="h-10 bg-border" />
                        <div>
                            <p className="text-sm text-muted-foreground">Pied Fort</p>
                            <p className="font-bold text-lg">{player.preferred_foot || 'N/A'}</p>
                        </div>
                         <Separator orientation="vertical" className="h-10 bg-border" />
                         <div>
                            <p className="text-sm text-muted-foreground">Numéro</p>
                            <p className="font-bold text-lg">{player.player_number || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <Separator className="bg-border/50" />
                    
                    <div className="space-y-4">
                        <StatRow icon={Target} label="Buts" value={player.goals || 0} barColorClass="bg-green-500" />
                        <StatRow icon={Shield} label="Fautes" value={player.fouls || 0} barColorClass="bg-yellow-500" />
                        <StatRow icon={Star} label="Présences" value={"N/A"} barColorClass="bg-blue-500" />
                    </div>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
