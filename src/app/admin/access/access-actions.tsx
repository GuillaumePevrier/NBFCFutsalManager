
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, UserPlus } from "lucide-react";
import type { Player } from "@/lib/types";
import { managePlayerAccess } from '@/app/actions';

const accessSchema = z.object({
  email: z.string().email("L'adresse email est invalide."),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères.").optional().or(z.literal('')),
});

type AccessFormValues = z.infer<typeof accessSchema>;

interface AccessActionsProps {
    player: Player;
    onUpdate: () => void;
}

export function AccessActions({ player, onUpdate }: AccessActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<AccessFormValues>({
        resolver: zodResolver(accessSchema),
        defaultValues: {
            email: player.email || '',
            password: '',
        }
    });

    const hasAccount = !!player.user_id;

    const onSubmit: SubmitHandler<AccessFormValues> = async (data) => {
        setIsLoading(true);

        const result = await managePlayerAccess(player.id, data.email, data.password);

        if (result.success) {
            toast({
                title: "Accès mis à jour !",
                description: `Le compte pour ${player.name} a été ${hasAccount ? 'modifié' : 'créé'}.`
            });
            onUpdate(); // Refresh the list on the parent page
            setIsOpen(false);
            reset();
        } else {
            toast({
                title: "Erreur",
                description: result.error || "Une erreur est survenue.",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant={hasAccount ? "outline" : "default"} className={hasAccount ? "btn neon-blue-sm" : "btn neon-primary-sm"}>
                    {hasAccount ? <KeyRound className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {hasAccount ? "Modifier l'accès" : "Créer l'accès"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Gérer l'accès de {player.name}</DialogTitle>
                        <DialogDescription>
                            {hasAccount
                                ? "Modifiez l'email ou définissez un nouveau mot de passe pour ce joueur."
                                : "Créez un compte de connexion pour ce joueur."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email de connexion</Label>
                            <Input id="email" type="email" {...register('email')} />
                            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="password">
                                {hasAccount ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                            </Label>
                            <Input id="password" type="password" {...register('password')} placeholder="Laisser vide pour ne pas changer" />
                            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                             {!hasAccount && !errors.password && <p className="text-xs text-muted-foreground">Le mot de passe est requis pour la création.</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {hasAccount ? "Sauvegarder" : "Créer le compte"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
