
import { getPlayerById } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Footprints, Shield, Shirt, Target } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <div className="bg-card p-4 rounded-lg flex items-center gap-4 border" style={{ borderColor: color }}>
    <div className="p-3 rounded-md" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }}/>
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
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
        <header className="p-4 flex items-center justify-start">
             <Button asChild variant="outline" size="sm">
               <Link href="/" className="flex items-center">
                 <ArrowLeft className="mr-2 h-4 w-4" />
                 Retour à l'accueil
               </Link>
             </Button>
        </header>
        <main className="flex-grow flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl mx-auto border-primary/20 shadow-lg">
                <CardHeader className="bg-card/50 p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Avatar className="w-24 h-24 border-4 border-primary">
                            <AvatarImage src={player.avatar_url} alt={player.name} />
                            <AvatarFallback className="text-4xl bg-primary text-primary-foreground">{fallbackInitials}</AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left">
                            <CardTitle className="text-3xl font-bold">{player.name}</CardTitle>
                            <CardDescription className="text-lg text-primary">{player.position || 'Non spécifié'}</CardDescription>
                            <div className="flex items-center gap-4 mt-2 text-muted-foreground justify-center sm:justify-start">
                                <span className="flex items-center gap-1"><Shirt className="w-4 h-4" />{player.team}</span>
                                <span className="flex items-center gap-1"><Footprints className="w-4 h-4" />{player.preferred_foot || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Statistiques de Saison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard icon={Target} label="Buts" value={player.goals || 0} color="hsl(var(--primary))" />
                        <StatCard icon={Shield} label="Fautes" value={player.fouls || 0} color="hsl(var(--ring))" />
                         <StatCard icon={Shield} label="Présences" value={ "N/A"} color="hsl(var(--accent))" />
                    </div>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
