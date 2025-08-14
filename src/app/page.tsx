
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
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
  { id: 0, title: 'Matchs', href: '/matches', icon: Trophy, imageUrl: 'https://placehold.co/208x160.png', },
  { id: 1, title: 'Effectif', href: '/admin/players', icon: Users, imageUrl: 'https://placehold.co/208x160.png' },
  { id: 2, title: 'Adversaires', href: '/admin/opponents', icon: Shield, imageUrl: 'https://placehold.co/208x160.png' },
  { id: 3, title: 'Statistiques', href: '/stats', icon: BarChart3, imageUrl: 'https://placehold.co/208x160.png' },
  { id: 4, title: 'Site du Club', href: 'https://futsal.noyalbrecefc.com/', icon: Globe, imageUrl: 'https://placehold.co/208x160.png', target: '_blank' },
];

const CARD_ARC_ANGLE = 25; // Angle de chaque carte par rapport au centre
const CARD_WIDTH = 200; // Largeur de la carte en pixels
const CARD_RADIUS = 350; // Rayon du cercle sur lequel les cartes sont disposées

export default function Home() {
  const router = useRouter();
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const x = useMotionValue(0);
  const input = [-CARD_WIDTH * 2, -CARD_WIDTH, 0, CARD_WIDTH, CARD_WIDTH * 2];
  const output = [45, 20, 0, -20, -45];
  const rotate = useTransform(x, input, output);

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const newX = x.get() + info.offset.x;
    const newIndex = Math.round(newX / CARD_WIDTH);
    x.set(newX);
    animate(x, -newIndex * CARD_WIDTH, { type: 'spring', stiffness: 400, damping: 50 });
  };
  
  const handleCardTap = (cardId: number) => {
    if (selectedCard === cardId) {
      // Si on clique sur la carte déjà sélectionnée, naviguer
      const card = cardData.find(c => c.id === cardId);
      if (card) {
        if (card.target === '_blank') {
          window.open(card.href, '_blank', 'noopener,noreferrer');
        } else {
          router.push(card.href);
        }
      }
    } else {
      // Sinon, la sélectionner
      setSelectedCard(cardId);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden">
      {/* --- Vidéo en arrière-plan --- */}
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
        {/* Surcouche sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={() => {}} />
      
      <main 
        className="flex-grow flex flex-col items-center justify-between relative p-4"
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedCard(null); }}
      >
        {/* --- Logo du Club --- */}
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

        {/* --- Carrousel de Cartes --- */}
        <motion.div 
          className="relative w-full h-[500px] flex items-center justify-center cursor-grab"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -CARD_WIDTH * (cardData.length -1), right: 0 }}
          onDragEnd={onDragEnd}
        >
          {cardData.map((card, index) => {
            const isSelected = selectedCard === card.id;
            const cardX = -index * CARD_WIDTH;
            const distance = useTransform(x, (latestX) => Math.abs(latestX - cardX));
            const scale = useTransform(distance, [0, CARD_WIDTH * 2], [1, 0.7]);
            const opacity = useTransform(distance, [0, CARD_WIDTH * 2], [1, 0.3]);
            
            return (
              <motion.div
                key={card.id}
                className="absolute"
                style={{
                  transformOrigin: 'bottom center',
                  x: cardX,
                  y: useTransform(distance, [0, CARD_WIDTH*2], [0, 80]),
                  rotate: useTransform(x, (latestX) => (latestX - cardX) / (CARD_WIDTH / (CARD_ARC_ANGLE * 0.5))),
                  z: useTransform(distance, [0, CARD_WIDTH*2], [10, 0]),
                  scale,
                  opacity,
                }}
                animate={{
                  y: isSelected ? -80 : useTransform(distance, [0, CARD_WIDTH*2], [0, 80]),
                  scale: isSelected ? 1.15 : scale,
                  zIndex: isSelected ? 20 : useTransform(distance, [0, CARD_WIDTH*2], [10, 0]),
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onTap={() => handleCardTap(card.id)}
              >
                <MotionCard
                  className={cn(
                    "w-[220px] h-[300px] bg-gradient-to-br from-card/30 to-card/10 backdrop-blur-lg rounded-2xl overflow-hidden border-2 border-primary/20 transition-all duration-300 shadow-2xl",
                    "shadow-primary/20 hover:shadow-primary/40",
                    isSelected ? "shadow-primary/60" : ""
                  )}
                  style={{
                     boxShadow: `0 0 5px hsl(var(--primary) / 0.3), 0 0 10px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--primary) / 0.1), inset 0 0 10px hsl(var(--primary) / 0.2)`,
                  }}
                >
                  <CardContent className="flex flex-col h-full text-center p-0">
                    <div className="flex-grow h-2/5 flex items-center justify-center bg-black/10 relative">
                        <Image src={card.imageUrl} alt={`Illustration pour ${card.title}`} fill className="object-cover opacity-70"/>
                        <card.icon className="w-12 h-12 text-white/80 drop-shadow-lg relative" />
                    </div>
                    <div className="p-4 bg-gradient-to-t from-black/50 to-black/20 flex-grow h-3/5 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-card-foreground tracking-wide">{card.title}</h3>
                        <div className="flex items-center justify-center text-sm text-primary mt-2 opacity-80 group-hover:opacity-100">
                          Accéder <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>
                  </CardContent>
                </MotionCard>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}

  