
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import IncompleteProfile from '@/components/IncompleteProfile';
import type { Player } from '@/lib/types';

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
  { id: 3, title: 'Matchs', href: '/matches', imageUrl: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2025/08/NBFCMatch.png', dataAiHint: 'futsal goal celebration', objectPosition: 'object-top' },
  { id: 4, title: 'Entraînements', href: '/trainings', imageUrl: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2025/08/Image.png', dataAiHint: 'futsal training session', objectPosition: 'object-top' },
];

export default function Home() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(1);
  const [showProfileLink, setShowProfileLink] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkPlayerProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if there is a player profile linked to this user
        const { data: player, error } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        // If no player profile is found, show the linking component
        if (!player && !error) {
          setShowProfileLink(true);
        } else {
          setShowProfileLink(false);
        }
      }
    };

    checkPlayerProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN") {
            checkPlayerProfile();
        }
        if (event === "SIGNED_OUT") {
            setShowProfileLink(false);
        }
    });

    return () => {
        authListener?.subscription.unsubscribe();
    };
  }, [supabase]);


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
  
  if (showProfileLink) {
    return <IncompleteProfile onProfileLinked={() => setShowProfileLink(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden">
       <div className="absolute inset-0 w-full h-full -z-10">
         <video 
            src="https://futsal.noyalbrecefc.com/wp-content/uploads/2025/07/telechargement-1.mp4" 
            autoPlay 
            loop 
            muted
            playsInline
            className="w-full h-full object-cover object-center"
         />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      
       <div className="flex-shrink-0 pt-10 flex justify-center">
            <Image
                src="https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png"
                alt="Logo du club NBFC Futsal"
                width={200}
                height={200}
                className="w-40 h-40 md:w-48 md:h-48 drop-shadow-2xl"
                priority
            />
        </div>
      
      <main className="flex-grow flex flex-col items-center justify-center relative pb-8 md:pb-12 mt-12">
         <motion.div 
            className="relative w-full h-[550px] md:h-[650px] flex items-center justify-center"
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
                      boxShadow: `0 0 15px hsl(var(--primary) / 1), 0 0 30px hsl(var(--primary) / 0.8), 0 0 60px hsl(var(--primary) / 0.6), inset 0 0 25px hsl(var(--primary) / 0.6)`
                    };

                    const inactiveNeonStyle = {
                      boxShadow: `0 0 12px hsl(212 96% 48% / 0.8), 0 0 25px hsl(212 96% 48% / 0.7), inset 0 0 20px hsl(212 96% 48% / 0.5)`
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
                                x: offset * 140,
                                y: Math.abs(offset) * 25,
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
                                    "w-[280px] h-[480px] md:w-[340px] md:h-[550px] bg-gradient-to-br from-card/30 to-card/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 transition-all duration-300",
                                    isActive ? "cursor-pointer border-primary/50" : "cursor-grab border-blue-500/30",
                                    "hover:shadow-primary/60"
                                )}
                                style={isActive ? activeNeonStyle : inactiveNeonStyle}
                            >
                                <CardContent className="flex flex-col h-full text-center p-0 relative">
                                    <div className="absolute inset-0 h-full w-full">
                                        <Image src={card.imageUrl} alt={`Illustration pour ${card.title}`} fill className={cn("object-cover opacity-80", card.objectPosition)} data-ai-hint={card.dataAiHint} />
                                    </div>
                                    <div className="relative mt-auto flex-grow flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                            {isActive && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                >
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="bg-transparent border-2 border-primary/80 text-primary-foreground font-bold hover:bg-transparent hover:text-primary-foreground hover:border-primary hover:shadow-[0_0_15px_hsl(var(--primary)/0.8)] transition-all duration-300"
                                                    onClick={() => handleCardClick(card)}
                                                    >
                                                        {card.title}
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
      </main>
    </div>
  );
}
