
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart3, Shield, Users, Trophy, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import { cn } from '@/lib/utils';

const MotionCard = motion(Card);

interface NavCardData {
  id: number;
  title: string;
  href: string;
  icon: React.ElementType;
  imageUrl: string;
  target?: string;
}

const cardData: NavCardData[] = [
  { id: 1, title: 'Matchs', href: '/matches', icon: Trophy, imageUrl: 'https://placehold.co/220x300.png' },
  { id: 2, title: 'Effectif', href: '/admin/players', icon: Users, imageUrl: 'https://placehold.co/220x300.png' },
  { id: 3, title: 'Adversaires', href: '/admin/opponents', icon: Shield, imageUrl: 'https://placehold.co/220x300.png' },
];

export default function Home() {
  const router = useRouter();
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);

  const handleCardClick = (card: NavCardData) => {
    if (card.target === '_blank') {
        window.open(card.href, '_blank', 'noopener,noreferrer');
    } else {
        router.push(card.href);
    }
  }

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden">
      <div className="absolute inset-0 w-full h-full -z-10">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
          src="https://futsal.noyalbrecefc.com/wp-content/uploads/2025/07/telechargement-1.mp4"
        >
          Votre navigateur ne supporte pas la vidéo.
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={() => {}} />
      
      <main className="flex-grow flex flex-col items-center justify-between relative p-4">
        <div className="flex-shrink-0 pt-8">
            <Image
                src="https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png"
                alt="Logo du club NBFC Futsal"
                width={128}
                height={128}
                className="w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl"
                priority
            />
        </div>

        <div className="relative w-full flex-grow flex items-center justify-center">
            <div className="flex items-center justify-center gap-x-[-60px] md:gap-x-[-80px]">
                {cardData.map((card, index) => {
                    const rotations = [-10, 0, 10];
                    return (
                        <MotionCard
                            key={card.id}
                            drag
                            dragConstraints={{ top: -100, left: -200, right: 200, bottom: 100 }}
                            dragElastic={0.1}
                            initial={{ rotate: rotations[index], y: 20, x: 0 }}
                            whileHover={{ scale: 1.05, zIndex: 50, y: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            onClick={() => handleCardClick(card)}
                            className={cn(
                                "w-[220px] h-[320px] bg-gradient-to-br from-card/30 to-card/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-primary/30 transition-all duration-300 shadow-2xl cursor-grab",
                                "hover:shadow-primary/60"
                            )}
                            style={{
                                boxShadow: `0 0 5px hsl(var(--primary) / 0.4), 0 0 10px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.2), inset 0 0 15px hsl(var(--primary) / 0.2)`,
                            }}
                        >
                            <CardContent className="flex flex-col h-full text-center p-0">
                                <div className="flex-grow h-3/5 flex items-center justify-center bg-black/20 relative">
                                    <Image src={card.imageUrl} alt={`Illustration pour ${card.title}`} fill className="object-cover opacity-80" data-ai-hint="futsal action" />
                                    <card.icon className="w-16 h-16 text-white/80 drop-shadow-lg relative" />
                                </div>
                                <div className="p-4 bg-gradient-to-t from-black/60 to-black/30 flex-grow h-2/5 flex flex-col justify-center">
                                    <h3 className="text-xl font-bold text-card-foreground tracking-wide">{card.title}</h3>
                                    <div className="flex items-center justify-center text-sm text-primary mt-2 opacity-80 group-hover:opacity-100">
                                        Accéder <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </CardContent>
                        </MotionCard>
                    )
                })}
            </div>
        </div>
      </main>
    </div>
  );
}
