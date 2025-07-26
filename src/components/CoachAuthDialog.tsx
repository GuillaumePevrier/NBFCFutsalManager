'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CoachAuthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthenticated: () => void;
}

export default function CoachAuthDialog({ isOpen, onOpenChange, onAuthenticated }: CoachAuthDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // In a real app, you would have a dedicated coach email.
    // For this app, we use a generic email and the password provided.
    const { error } = await supabase.auth.signInWithPassword({
      email: 'coach@nbfcfutsal.com',
      password: password,
    });
    
    if (error) {
      setError("Mot de passe incorrect.");
      toast({
        title: "Échec de l'authentification",
        description: "Le mot de passe est incorrect.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Authentification réussie",
        description: "Le mode Coach est maintenant activé.",
      });
      onAuthenticated();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword("");
      setError("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Accès Coach
            </DialogTitle>
            <DialogDescription>
              Veuillez entrer le mot de passe pour activer les fonctionnalités de modification. L'email est pré-rempli.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="col-span-3"
                value="coach@nbfcfutsal.com"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Mot de passe
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="col-span-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="col-span-4 text-center text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit">Se connecter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
