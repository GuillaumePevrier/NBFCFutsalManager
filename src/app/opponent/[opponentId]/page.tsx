
import { getOpponentById } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AtSign, Building, Phone, Shield, Trophy, User, MapPin } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface InfoRowProps {
    icon: React.ElementType;
    label: string;
    value?: string | null;
}

const InfoRow = ({ icon: Icon, label, value }: InfoRowProps) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-4 text-card-foreground">
      <Icon className="w-5 h-5 text-primary" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-semibold text-sm">{value}</span>
      </div>
    </div>
  );
};


export default async function OpponentPage({ params }: { params: { opponentId: string } }) {
  const opponent = await getOpponentById(params.opponentId);

  if (!opponent) {
    notFound();
  }
  
  const fallbackInitials = opponent.team_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground main-bg">
        <Header>
            <Button asChild variant="outline" size="sm">
                <Link href="/admin/opponents" className="flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Équipes Adverses
                </Link>
            </Button>
        </Header>
        <main className="flex-grow flex items-center justify-center p-4">
            <Card className="w-full max-w-sm mx-auto bg-gradient-to-br from-card to-background border-2 border-primary/20 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent relative">
                   {opponent.logo_url && (
                        <div 
                            className="absolute inset-0 bg-cover bg-center opacity-10" 
                            style={{ backgroundImage: `url('${opponent.logo_url}')` }}
                        />
                   )}
                    <div className="flex flex-col items-center gap-4 relative">
                        <Avatar className="w-32 h-32 border-4 border-accent shadow-lg">
                            <AvatarImage src={opponent.logo_url} alt={opponent.team_name} className="object-cover" />
                            <AvatarFallback className="text-5xl bg-primary text-primary-foreground">{fallbackInitials}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-card-foreground tracking-tight">{opponent.team_name}</h1>
                            <p className="text-lg font-semibold text-primary">{opponent.club_name || 'Club non spécifié'}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6 space-y-5">
                    
                    <InfoRow icon={Trophy} label="Championnat" value={opponent.championship} />
                     <Separator className="bg-border/50" />
                    <div className="space-y-4">
                        <InfoRow icon={User} label="Coach" value={opponent.coach_name} />
                        <InfoRow icon={AtSign} label="Email Coach" value={opponent.coach_email} />
                        <InfoRow icon={Phone} label="Téléphone Coach" value={opponent.coach_phone} />
                        <InfoRow icon={MapPin} label="Adresse" value={opponent.address} />
                    </div>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}

