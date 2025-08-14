
'use client';

import { useState, useEffect, useRef } from 'react';
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
  { id: 0, title: 'Matchs', href: '/matches', icon: Trophy, imageUrl: 'https://placehold.co/220x300.png', },
  { id: 1, title: 'Effectif', href: '/admin/players', icon: Users, imageUrl: 'https://placehold.co/220x300.png' },
  { id: 2, title: 'Adversaires', href: '/admin/opponents', icon: Shield, imageUrl: 'https://placehold.co/220x300.png' },
  { id: 3, title: 'Statistiques', href: '/stats', icon: BarChart3, imageUrl: 'https://placehold.co/220x300.png' },
  { id: 4, title: 'Site du Club', href: 'https://futsal.noyalbrecefc.com/', icon: Globe, imageUrl: 'https://placehold.co/220x300.png', target: '_blank' },
];

const CARD_WIDTH = 220;
const CARD_SPACING = 40;
const TOTAL_CARD_WIDTH = CARD_WIDTH + CARD_SPACING;

export default function Home() {
  const router = useRouter();
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const x = useMotionValue(0);

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    const direction = velocity > 0 ? -1 : 1;
    const distance = Math.abs(offset);

    // Snap to the nearest card
    const cardIndex = Math.round((x.get() + offset) / TOTAL_CARD_WIDTH);
    const targetX = cardIndex * TOTAL_CARD_WIDTH;

    animate(x, targetX, {
      type: 'spring',
      stiffness: 400,
      damping: 50,
      mass: 0.5,
    });
  };
  
  const handleCardTap = (cardId: number) => {
    if (selectedCard === cardId) {
      const card = cardData.find(c => c.id === cardId);
      if (card) {
        if (card.target === '_blank') {
          window.open(card.href, '_blank', 'noopener,noreferrer');
        } else {
          router.push(card.href);
        }
      }
    } else {
      setSelectedCard(cardId);
      const targetX = -cardId * TOTAL_CARD_WIDTH;
      animate(x, targetX, { type: 'spring', stiffness: 400, damping: 50 });
    }
  };


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
      
      <main 
        className="flex-grow flex flex-col items-center justify-between relative p-4"
        onClick={(e) => { 
          if (e.target === e.currentTarget) {
            setSelectedCard(null); 
          }
        }}
      >
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

        <motion.div 
          className="relative w-full h-[500px] flex items-center justify-center cursor-grab"
          style={{ perspective: '1000px' }}
        >
          <motion.div
            className="flex"
            style={{ x }}
            drag="x"
            dragConstraints={{ left: -TOTAL_CARD_WIDTH * (cardData.length -1), right: 0 }}
            onDragEnd={onDragEnd}
          >
            {cardData.map((card, index) => {
              const isSelected = selectedCard === card.id;
              
              const cardX = -index * TOTAL_CARD_WIDTH;
              const distance = useTransform(x, (latestX) => Math.abs(latestX - cardX));

              const scale = useTransform(distance, [0, TOTAL_CARD_WIDTH * 2], [1, 0.7]);
              const opacity = useTransform(distance, [0, TOTAL_CARD_WIDTH * 2], [1, 0.5]);
              const rotateY = useTransform(x, (latestX) => {
                const diff = (latestX - cardX) / TOTAL_CARD_WIDTH;
                return diff * -20; // Angle of rotation
              });
               const y = useTransform(distance, [0, TOTAL_CARD_WIDTH], [0, 50]);

              return (
                <motion.div
                  key={card.id}
                  className="absolute"
                  style={{
                    transformOrigin: 'bottom center',
                    x: cardX,
                    scale,
                    opacity,
                    rotateY,
                    y
                  }}
                  animate={{
                    y: isSelected ? y.get() - 100 : y.get(),
                    scale: isSelected ? 1.15 : scale.get(),
                    zIndex: isSelected ? 100 : Math.round(opacity.get() * 10),
                  }}
                   transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                   onTap={() => handleCardTap(card.id)}
                >
                  <MotionCard
                    className={cn(
                      "w-[220px] h-[320px] bg-gradient-to-br from-card/30 to-card/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-primary/30 transition-all duration-300 shadow-2xl",
                      isSelected ? "shadow-primary/60" : "shadow-primary/20",
                      "hover:shadow-primary/40"
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
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
