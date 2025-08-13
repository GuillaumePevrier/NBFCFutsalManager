
'use client';

import { useState } from 'react';
import type { Role } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import CoachAuthDialog from '@/components/CoachAuthDialog';

const MotionCard = motion(Card);

interface NavCardProps {
  title: string;
  imageUrl: string;
  href: string;
  rotation: number;
  translationX: number;
}

const NavCard = ({ title, imageUrl, href, rotation, translationX }: NavCardProps) => {
  const router = useRouter();
  
  return (
    <MotionCard
      drag
      dragConstraints={{ left: -150, right: 150, top: -50, bottom: 50 }}
      dragElastic={0.2}
      whileHover={{ scale: 1.1, zIndex: 10, rotate: rotation + (Math.random() - 0.5) * 5 }}
      whileTap={{ scale: 0.95, cursor: 'grabbing' }}
      initial={{ rotate: rotation, x: translationX, y: 20, opacity: 0 }}
      animate={{ rotate: rotation, x: translationX, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 10 }}
      onClick={() => router.push(href)}
      className="absolute w-52 h-64 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-md border-2 border-primary/20 shadow-2xl rounded-2xl cursor-grab overflow-hidden"
    >
      <CardContent className="flex flex-col h-full text-center p-0">
        <div className="flex-grow flex items-center justify-center bg-black/10 relative">
            <Image src={imageUrl} alt={`Illustration pour ${title}`} fill className="object-cover"/>
        </div>
        <Separator className="bg-primary/20" />
        <div className="p-4 bg-black/20">
            <h3 className="text-xl font-bold text-card-foreground">{title}</h3>
            <div className="flex items-center justify-center text-sm text-primary mt-2">
            Accéder <ArrowRight className="w-4 h-4 ml-1" />
            </div>
        </div>
      </CardContent>
    </MotionCard>
  );
};

export default function Home() {
  const [role, setRole] = useState<Role>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const supabase = createClient();
  
  const cardData = [
    { id: 1, title: 'Matchs', href: '/matches', rotation: -15, translationX: -120, imageUrl: 'https://placehold.co/208x160.png' },
    { id: 2, title: 'Effectif', href: '/admin/players', rotation: 0, translationX: 0, imageUrl: 'https://placehold.co/208x160.png' },
    { id: 3, title: 'Adversaires', href: '/admin/opponents', rotation: 15, translationX: 120, imageUrl: 'https://placehold.co/208x160.png' },
  ];

  const onCoachLogin = () => {
    setRole('coach');
    setIsCoachAuthOpen(false);
  }


  return (
    <div className="flex flex-col min-h-screen text-foreground">
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
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      
      <main className="flex-grow flex flex-col items-center justify-between relative p-4">
        {/* Logo */}
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

        {/* Interactive Card Deck */}
        <div className="relative w-full h-80 flex items-center justify-center mb-8">
            {cardData.map((card) => (
              <NavCard 
                key={card.id} 
                {...card} 
              />
            ))}
        </div>
      </main>
    </div>
  );
}
