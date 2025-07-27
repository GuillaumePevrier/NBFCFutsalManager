
'use client';

import { useState, useEffect } from 'react';
import type { MatchDetails as MatchDetailsType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from './ui/button';
import { CalendarDays, Clock, MapPin, Users, Info, Save, Swords } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface MatchDetailsProps {
  details: MatchDetailsType;
  onDetailsChange: (details: MatchDetailsType) => void;
  isCoach: boolean;
}

export default function MatchDetails({ details, onDetailsChange, isCoach }: MatchDetailsProps) {
  const [currentDetails, setCurrentDetails] = useState<MatchDetailsType>(details);

  useEffect(() => {
    setCurrentDetails(details);
  }, [details]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentDetails(prev => ({ ...prev, [name]: value as any }));
  };

  const handleSelectChange = (value: '20min' | '25min') => {
    setCurrentDetails(prev => ({ ...prev, matchType: value }));
  }

  const handleSave = () => {
    onDetailsChange(currentDetails);
  };

  const DetailItem = ({ icon: Icon, label, value, name, placeholder, isCoach, isTextarea = false, children }: any) => (
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
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="mt-1 bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
            ) : (
                <Input
                    id={name}
                    name={name}
                    type={name === 'date' ? 'date' : name === 'time' ? 'time' : 'text'}
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="mt-1 bg-transparent border-0 border-b rounded-none px-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
            )
        ) : (
          <p className="font-medium text-sm pt-1">{value || '-'}</p>
        )}
      </div>
    </div>
  );
  
  return (
    <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className='flex-row items-center justify-between p-4'>
        <CardTitle className="text-base font-semibold">Détails du Match</CardTitle>
        {isCoach && <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4"/>Sauvegarder les détails</Button>}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          <DetailItem icon={Users} label="Adversaire" value={currentDetails.opponent} name="opponent" placeholder="Nom de l'équipe" isCoach={isCoach} />
          <DetailItem icon={CalendarDays} label="Date" value={currentDetails.date} name="date" placeholder="JJ/MM/AAAA" isCoach={isCoach} />
          <DetailItem icon={Clock} label="Heure" value={currentDetails.time} name="time" placeholder="HH:MM" isCoach={isCoach} />
          <DetailItem icon={MapPin} label="Lieu" value={currentDetails.location} name="location" placeholder="Adresse du match" isCoach={isCoach} />
          
          <DetailItem icon={Swords} label="Type de Match" name="matchType" isCoach={isCoach} value={currentDetails.matchType === '20min' ? "20 min (arrêté)" : "25 min (continu)"}>
             <Select onValueChange={handleSelectChange} value={currentDetails.matchType} name="matchType">
                <SelectTrigger className="mt-1 bg-transparent border-0 border-b rounded-none px-0 h-8 focus:ring-0 focus:ring-offset-0 focus:border-primary">
                    <SelectValue placeholder="Choisir le type..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="20min">20 min (temps arrêté)</SelectItem>
                    <SelectItem value="25min">25 min (temps continu)</SelectItem>
                </SelectContent>
            </Select>
          </DetailItem>

          <div className="sm:col-span-2 md:col-span-3">
             <DetailItem icon={Info} label="Remarques" value={currentDetails.remarks} name="remarks" placeholder="Instructions, notes..." isCoach={isCoach} isTextarea />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
