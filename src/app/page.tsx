
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import type { Role } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, Shield, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MotionCard = motion(Card);

interface NavCardProps {
  title: string;
  icon: React.ElementType;
  href: string;
  rotation: number;
  translationX: number;
}

const NavCard = ({ title, icon: Icon, href, rotation, translationX }: NavCardProps) => {
  const router = useRouter();
  
  return (
    <MotionCard
      drag
      dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
      dragElastic={0.1}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      whileTap={{ scale: 0.95, cursor: 'grabbing' }}
      initial={{ rotate: rotation, x: translationX, y: 20 }}
      animate={{ rotate: rotation, x: translationX, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 10 }}
      onClick={() => router.push(href)}
      className="absolute w-52 h-64 bg-card/80 backdrop-blur-md border-2 border-primary/20 shadow-2xl rounded-2xl cursor-grab overflow-hidden"
    >
      <CardContent className="flex flex-col items-center justify-center h-full text-center p-4">
        <Icon className="w-16 h-16 text-primary mb-4" />
        <h3 className="text-xl font-bold text-card-foreground">{title}</h3>
        <div className="flex items-center text-sm text-primary mt-auto">
          Accéder <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </CardContent>
    </MotionCard>
  );
};


export default function Home() {
  const [role, setRole] = useState<Role>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const supabase = createClient();
  
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

  const onCoachLogin = () => {
    setRole('coach');
    setIsCoachAuthOpen(false);
  }

  const cards = [
    { id: 1, title: 'Matchs', icon: Trophy, href: '/matches', rotation: -10, translationX: -80 },
    { id: 2, title: 'Effectif', icon: Users, href: '/admin/players', rotation: 0, translationX: 0 },
    { id: 3, title: 'Adversaires', icon: Shield, href: '/admin/opponents', rotation: 10, translationX: 80 },
  ];

  return (
    <div className="flex flex-col min-h-screen text-foreground">
      <Header onCoachClick={() => setIsCoachAuthOpen(true)} />
      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      
      <main className="flex-grow flex flex-col items-center justify-end relative pb-24">
        {/* Background Video */}
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
        
        {/* Interactive Card Deck */}
        <div className="relative w-full h-72 flex items-center justify-center">
            {cards.map(card => (
              <NavCard key={card.id} {...card} />
            ))}
        </div>
      </main>
    </div>
  );
}
