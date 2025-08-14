
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart3, Shield, Users, Trophy, Globe, ChevronsLeftRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const MotionCard = motion(Card);

interface NavCardData {
  id: number;
  title: string;
  href: string;
  icon: React.ElementType;
  imageUrl: string;
  target?: string;
  dataAiHint: string;
}

const initialCardData: NavCardData[] = [
  { id: 1, title: 'Matchs', href: '/matches', icon: Trophy, imageUrl: 'https://placehold.co/220x320.png', dataAiHint: 'futsal goal celebration' },
  { id: 2, title: 'Effectif', href: '/admin/players', icon: Users, imageUrl: 'https://placehold.co/220x320.png', dataAiHint: 'futsal team huddle' },
  { id: 3, title: 'Adversaires', href: '/admin/opponents', icon: Shield, imageUrl: 'https://placehold.co/220x320.png', dataAiHint: 'futsal defensive wall' },
  { id: 4, title: 'Statistiques', href: '/stats', icon: BarChart3, imageUrl: 'https://placehold.co/220x320.png', dataAiHint: 'sports statistics chart' },
  { id: 5, title: 'Site du Club', href: 'https://futsal.noyalbrecefc.com/', icon: Globe, imageUrl: 'https://placehold.co/220x320.png', dataAiHint: 'futsal club logo', target: '_blank' },
];


export default function Home() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(2); // Start with the 3rd card (index 2) in center

  const handleCardClick = (card: NavCardData) => {
    if (card.target === '_blank') {
        window.open(card.href, '_blank', 'noopener,noreferrer');
    } else {
        router.push(card.href);
    }
  }

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    // Using velocity and offset to determine swipe strength and direction
    const swipePower = Math.abs(info.offset.x) * info.velocity.x;

    if (swipePower < -swipeThreshold) {
      // Swipe left
      setActiveIndex(prev => Math.min(initialCardData.length - 1, prev + 1));
    } else if (swipePower > swipeThreshold) {
      // Swipe right
      setActiveIndex(prev => Math.max(0, prev - 1));
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
      
       <div className="flex-shrink-0 pt-8 flex justify-center">
            <Image
                src="https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png"
                alt="Logo du club NBFC Futsal"
                width={128}
                height={128}
                className="w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl"
                priority
            />
        </div>
      
      <main className="flex-grow flex flex-col items-center justify-end relative pb-8 md:pb-12">
         <motion.div 
            className="relative w-full h-[320px] md:h-[400px] flex items-center justify-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ cursor: 'grab' }}
         >
             <AnimatePresence>
                {initialCardData.map((card, index) => {
                    const offset = index - activeIndex;
                    const isActive = offset === 0;

                    const activeNeonStyle = {
                      boxShadow: `0 0 5px hsl(var(--primary) / 0.8), 0 0 10px hsl(var(--primary) / 0.6), 0 0 20px hsl(var(--primary) / 0.4), inset 0 0 15px hsl(var(--primary) / 0.4)`
                    };

                    const inactiveNeonStyle = {
                      boxShadow: `0 0 5px hsl(212 96% 48% / 0.6), 0 0 10px hsl(212 96% 48% / 0.5), inset 0 0 10px hsl(212 96% 48% / 0.3)`
                    };

                    return (
                        <motion.div
                            key={card.id}
                            className="absolute"
                            initial={{
                                x: offset * 80,
                                scale: 1 - Math.abs(offset) * 0.2,
                                rotateY: offset * -25,
                                zIndex: initialCardData.length - Math.abs(offset),
                                opacity: Math.abs(offset) > 2 ? 0 : 1,
                            }}
                            animate={{
                                x: offset * 80,
                                scale: 1 - Math.abs(offset) * 0.2,
                                rotateY: offset * -25,
                                zIndex: initialCardData.length - Math.abs(offset),
                                opacity: Math.abs(offset) > 2 ? 0 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        >
                            <MotionCard
                                whileHover={isActive ? { y: -20, scale: 1.05 } : {}}
                                whileTap={isActive ? { scale: 1.1 } : {}}
                                onClick={() => isActive && handleCardClick(card)}
                                className={cn(
                                    "w-[180px] h-[280px] md:w-[220px] md:h-[320px] bg-gradient-to-br from-card/30 to-card/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 transition-all duration-300",
                                    isActive ? "cursor-pointer border-primary/50" : "cursor-grab border-blue-500/30",
                                    "hover:shadow-primary/60"
                                )}
                                style={isActive ? activeNeonStyle : inactiveNeonStyle}
                            >
                                <CardContent className="flex flex-col h-full text-center p-0">
                                    <div className="flex-grow h-3/5 flex items-center justify-center bg-black/20 relative">
                                        <Image src={card.imageUrl} alt={`Illustration pour ${card.title}`} fill className="object-cover opacity-80" data-ai-hint={card.dataAiHint} />
                                        <card.icon className="w-12 h-12 md:w-16 md:h-16 text-white/80 drop-shadow-lg relative" />
                                    </div>
                                    <div className="p-4 bg-gradient-to-t from-black/60 to-black/30 flex-grow h-2/5 flex flex-col justify-center">
                                        <h3 className="text-lg md:text-xl font-bold text-card-foreground tracking-wide">{card.title}</h3>
                                        {isActive && (
                                            <motion.div 
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              className="flex items-center justify-center text-sm text-primary mt-2 opacity-80 group-hover:opacity-100"
                                            >
                                                Accéder <ArrowRight className="w-4 h-4 ml-1" />
                                            </motion.div>
                                        )}
                                    </div>
                                </CardContent>
                            </MotionCard>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </motion.div>
         <div className="absolute bottom-4 text-center text-white/50 flex items-center gap-2 text-xs">
            <ChevronsLeftRight className="w-3 h-3" />
            <span>Glisser pour naviguer</span>
        </div>
      </main>
    </div>
  );
}
