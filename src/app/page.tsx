
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ChevronsLeftRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MotionCard = motion(Card);

interface NavCardData {
  id: number;
  title: string;
  href: string;
  imageUrl: string;
  target?: string;
  dataAiHint: string;
  objectPosition?: string;
}

const initialCardData: NavCardData[] = [
  { id: 1, title: 'Effectif', href: '/admin/players', imageUrl: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2025/08/NBFCffectif.png', dataAiHint: 'futsal team huddle', objectPosition: 'object-top' },
  { id: 2, title: 'Adversaires', href: '/admin/opponents', imageUrl: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2025/08/NBFCAdversaires.png', dataAiHint: 'futsal defensive wall', objectPosition: 'object-top' },
  { id: 3, title: 'Matchs', href: '/matches', imageUrl: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2025/08/NBFCMatch.png', dataAiHint: 'futsal goal celebration', objectPosition: 'object-top' },
  { id: 4, title: 'Statistiques', href: '/stats', imageUrl: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2025/08/NBFCMatch.png', dataAiHint: 'sports statistics chart', objectPosition: 'object-top' },
  { id: 5, title: 'Site du Club', href: 'https://futsal.noyalbrecefc.com/', imageUrl: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2025/08/NBFCMatch.png', dataAiHint: 'futsal club logo', target: '_blank', objectPosition: 'object-top' },
];


export default function Home() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(2); 

  const handleCardClick = (card: NavCardData) => {
    if (card.target === '_blank') {
        window.open(card.href, '_blank', 'noopener,noreferrer');
    } else {
        router.push(card.href);
    }
  }

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    const swipePower = Math.abs(info.offset.x) * info.velocity.x;

    if (info.offset.x < -swipeThreshold || swipePower < -10000) {
      setActiveIndex(prev => Math.min(initialCardData.length - 1, prev + 1));
    } else if (info.offset.x > swipeThreshold || swipePower > 10000) {
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
                width={200}
                height={200}
                className="w-40 h-40 md:w-48 md:h-48 drop-shadow-2xl"
                priority
            />
        </div>
      
      <main className="flex-grow flex flex-col items-center justify-center relative pb-8 md:pb-12">
         <motion.div 
            className="relative w-full h-[400px] md:h-[450px] flex items-center justify-center"
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
                                x: offset * 110,
                                y: Math.abs(offset) * 20,
                                scale: 1 - Math.abs(offset) * 0.15,
                                rotateY: offset * -15,
                                zIndex: initialCardData.length - Math.abs(offset),
                                opacity: Math.abs(offset) > 2 ? 0 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        >
                            <MotionCard
                                whileHover={isActive ? { y: -10 } : {}}
                                className={cn(
                                    "w-[180px] h-[280px] md:w-[220px] md:h-[320px] bg-gradient-to-br from-card/30 to-card/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 transition-all duration-300",
                                    isActive ? "cursor-pointer border-primary/50" : "cursor-grab border-blue-500/30",
                                    "hover:shadow-primary/60"
                                )}
                                style={isActive ? activeNeonStyle : inactiveNeonStyle}
                            >
                                <CardContent className="flex flex-col h-full text-center p-0">
                                    <div className="flex-grow h-3/5 flex items-center justify-center bg-black/20 relative">
                                        <Image src={card.imageUrl} alt={`Illustration pour ${card.title}`} fill className={cn("object-cover opacity-80", card.objectPosition)} data-ai-hint={card.dataAiHint} />
                                    </div>
                                    <div className="p-4 bg-gradient-to-t from-black/50 to-black/10 flex-grow h-2/5 flex flex-col justify-center items-center">
                                        <h3 className="text-lg md:text-xl font-bold text-card-foreground tracking-wide">{card.title}</h3>
                                        {isActive && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                               <Button 
                                                 size="sm" 
                                                 variant="default" 
                                                 className="mt-2 bg-primary/80 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                                 onClick={() => handleCardClick(card)}
                                                >
                                                    Accéder
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
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
