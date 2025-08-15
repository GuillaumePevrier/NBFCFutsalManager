
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Info, Star, ThumbsUp, Shirt, Target, Award, ThumbsDown, XSquare, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Separator } from "./ui/separator";

const positiveActions = [
    { icon: Shirt, action: "Lavage des Maillots", points: "+25", description: "Récompense une tâche essentielle pour l'équipe." },
    { icon: Award, action: "Homme du Match", points: "+20", description: "Désigné par le coach pour une performance exceptionnelle." },
    { icon: ThumbsUp, action: "Disponibilité au Sondage", points: "+10", description: "Récompense la réactivité et l'organisation." },
    { icon: Target, action: "But Marqué", points: "+5", description: "Valorise l'efficacité offensive en match." },
];

const negativeActions = [
    { icon: ThumbsDown, action: "Absence Injustifiée", points: "-20", description: "Malus pour non-respect de son engagement." },
    { icon: XSquare, action: "Carton Rouge", points: "-15", description: "Sanctionne une faute grave ou un comportement antisportif." },
    { icon: Clock, action: "Retard", points: "-5", description: "Encourage la ponctualité aux rendez-vous." },
];

const ActionRow = ({ icon: Icon, action, points, description, isPositive }: { icon: React.ElementType, action: string, points: string, description: string, isPositive: boolean }) => (
    <TableRow>
        <TableCell>
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                <div className="flex flex-col">
                    <span className="font-medium">{action}</span>
                    <span className="text-xs text-muted-foreground hidden sm:block">{description}</span>
                </div>
            </div>
        </TableCell>
        <TableCell className="text-right">
            <span className={`font-bold text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{points}</span>
        </TableCell>
    </TableRow>
);


export default function PointsScaleDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <span className="sr-only">Afficher le barème des points</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card/95 backdrop-blur-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Star className="text-yellow-400"/>
                        Barème des Points d'Implication
                    </DialogTitle>
                    <DialogDescription>
                        Chaque action compte ! Voici comment vos points sont calculés pour le classement.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    <h3 className="text-lg font-semibold mb-2 text-green-400">Actions Positives (Bonus)</h3>
                     <Table>
                        <TableBody>
                            {positiveActions.map(item => <ActionRow key={item.action} {...item} isPositive={true} />)}
                        </TableBody>
                    </Table>
                </div>
                
                <Separator />

                <div className="py-2">
                    <h3 className="text-lg font-semibold mb-2 text-red-400">Actions Négatives (Malus)</h3>
                     <Table>
                        <TableBody>
                            {negativeActions.map(item => <ActionRow key={item.action} {...item} isPositive={false} />)}
                        </TableBody>
                    </Table>
                </div>

            </DialogContent>
        </Dialog>
    );
}
