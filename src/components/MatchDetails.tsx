
'use client';

import { useState, useEffect } from 'react';
import type { MatchDetails as MatchDetailsType, Opponent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from './ui/button';
import { CalendarDays, Clock, MapPin, Users, Info, Save, Swords, Trophy, Hash, Home } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { getOpponents } from '@/app/actions';

interface MatchDetailsProps {
  details: MatchDetailsType;
  onDetailsChange: (details: MatchDetailsType) => void;
  isCoach: boolean;
}

const competitions = [
    { id: 'D2 Nationale', name: 'D2 Nationale' },
    { id: 'Régionale 1', name: 'Régionale 1' },
    { id: 'District 1', name: 'District 1' },
    { id: 'District 2', name: 'District 2' },
    { id: 'Coupe de Bretagne', name: 'Coupe de Bretagne' },
    { id: 'Coupe du District', name: 'Coupe du District' },
    { id: 'Coupe de France', name: 'Coupe de France' },
    { id: 'Amical', name: 'Amical' },
];

export default function MatchDetails({ details, onDetailsChange, isCoach }: MatchDetailsProps) {
  const [currentDetails, setCurrentDetails] = useState<MatchDetailsType>(details);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const debouncedDetails = useDebounce(currentDetails, 500);

  useEffect(() => {
    const fetchOpponents = async () => {
      const data = await getOpponents();
      setOpponents(data);
    };
    fetchOpponents();
  }, []);

  // Update internal state if props change from server
  useEffect(() => {
    setCurrentDetails(details);
  }, [details]);

  // Effect to call the parent onDetailsChange when debouncedDetails change
  useEffect(() => {
    if (JSON.stringify(debouncedDetails) !== JSON.stringify(details)) {
        onDetailsChange(debouncedDetails);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDetails]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCurrentDetails(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseInt(value) || 0 : value as any 
    }));
  };
  
  const handleOpponentChange = (opponentId: string) => {
    const selectedOpponent = opponents.find(o => o.id === opponentId);
    if (selectedOpponent) {
      const newDetails = { 
        ...currentDetails, 
        opponentId: selectedOpponent.id, 
        opponent: selectedOpponent.team_name 
      };
      setCurrentDetails(newDetails);
      onDetailsChange(newDetails);
    }
  };

  const handleSelectChange = (name: 'matchType' | 'competition' | 'venue', value: string) => {
    const newDetails = { ...currentDetails, [name]: value };
    setCurrentDetails(newDetails);
    onDetailsChange(newDetails); // For selects, we can update immediately
  }

  const handleSave = () => {
    onDetailsChange(currentDetails);
  };

  const DetailItem = ({ icon: Icon, label, value, name, placeholder, isCoach, isTextarea = false, children, type = 'text' }: any) => (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-primary mt-1.5 flex-shrink-0" />
      <div className="flex-grow">
        <Label htmlFor={name} className="text-xs font-semibold text-muted-foreground">{label}</Label>
        {isCoach ? (
            children ? children :
            isTextarea ? (
                <Textarea
                    id={name}
                    name={name}
                    value={value || ''}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="mt-1 bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
            ) : (
                <Input
                    id={name}
                    name={name}
                    type={type}
                    value={value || ''}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="mt-1 bg-transparent border-0 border-b rounded-none px-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
            )
        ) : (
          <p className="font-medium text-sm pt-1 truncate">{value || '-'}</p>
        )}
      </div>
    </div>
  );
  
  return (
    <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className='flex-row items-center justify-between p-4'>
        <CardTitle className="text-base font-semibold">Détails du Match</CardTitle>
        {isCoach && <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4"/>Sauvegarder</Button>}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          <DetailItem icon={Users} label="Adversaire" name="opponent" isCoach={isCoach} value={currentDetails.opponent}>
             <Select onValueChange={handleOpponentChange} value={currentDetails.opponentId} name="opponentId" disabled={!isCoach}>
                <SelectTrigger className="mt-1 bg-transparent border-0 border-b rounded-none px-0 h-8 focus:ring-0 focus:ring-offset-0 focus:border-primary disabled:opacity-100 disabled:cursor-default">
                    <SelectValue placeholder="Choisir une équipe..." />
                </SelectTrigger>
                <SelectContent>
                    {opponents.map(o => (
                       <SelectItem key={o.id} value={o.id}>{o.team_name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </DetailItem>
          <DetailItem icon={CalendarDays} label="Date" value={currentDetails.date} name="date" placeholder="JJ/MM/AAAA" isCoach={isCoach} type="date" />
          <DetailItem icon={Clock} label="Heure" value={currentDetails.time} name="time" placeholder="HH:MM" isCoach={isCoach} type="time"/>
          
          <DetailItem icon={Home} label="Lieu de la rencontre" name="venue" isCoach={isCoach} value={currentDetails.venue === 'home' ? "Domicile" : "Extérieur"}>
             <Select onValueChange={(val) => handleSelectChange('venue', val)} value={currentDetails.venue} name="venue" disabled={!isCoach}>
                <SelectTrigger className="mt-1 bg-transparent border-0 border-b rounded-none px-0 h-8 focus:ring-0 focus:ring-offset-0 focus:border-primary disabled:opacity-100 disabled:cursor-default">
                    <SelectValue placeholder="Choisir le lieu..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="home">Domicile</SelectItem>
                    <SelectItem value="away">Extérieur</SelectItem>
                </SelectContent>
            </Select>
          </DetailItem>
          <DetailItem icon={MapPin} label="Adresse" value={currentDetails.location} name="location" placeholder="Adresse du match" isCoach={isCoach} />
          
          <DetailItem icon={Swords} label="Type de Match" name="matchType" isCoach={isCoach} value={currentDetails.matchType === '20min' ? "20 min (arrêté)" : "25 min (continu)"}>
             <Select onValueChange={(val) => handleSelectChange('matchType', val)} value={currentDetails.matchType} name="matchType" disabled={!isCoach}>
                <SelectTrigger className="mt-1 bg-transparent border-0 border-b rounded-none px-0 h-8 focus:ring-0 focus:ring-offset-0 focus:border-primary disabled:opacity-100 disabled:cursor-default">
                    <SelectValue placeholder="Choisir le type..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="20min">20 min (temps arrêté)</SelectItem>
                    <SelectItem value="25min">25 min (temps continu)</SelectItem>
                </SelectContent>
            </Select>
          </DetailItem>
          
          <DetailItem icon={Trophy} label="Compétition" name="competition" isCoach={isCoach} value={currentDetails.competition}>
             <Select onValueChange={(val) => handleSelectChange('competition', val as string)} value={currentDetails.competition} name="competition" disabled={!isCoach}>
                <SelectTrigger className="mt-1 bg-transparent border-0 border-b rounded-none px-0 h-8 focus:ring-0 focus:ring-offset-0 focus:border-primary disabled:opacity-100 disabled:cursor-default">
                    <SelectValue placeholder="Choisir la compétition..." />
                </SelectTrigger>
                <SelectContent>
                    {competitions.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </DetailItem>

          <DetailItem icon={Hash} label="Journée" value={currentDetails.matchday || ''} name="matchday" placeholder="N°" isCoach={isCoach} type="number" />
          
          <div className="sm:col-span-2 md:col-span-3">
             <DetailItem icon={Info} label="Remarques" value={currentDetails.remarks} name="remarks" placeholder="Instructions, notes..." isCoach={isCoach} isTextarea />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
