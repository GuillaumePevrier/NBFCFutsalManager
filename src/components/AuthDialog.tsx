
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
import { Loader2, KeyRound } from "lucide-react";
import { signInWithPassword } from "@/app/actions";

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthenticated: () => void;
}

export default function AuthDialog({ isOpen, onOpenChange, onAuthenticated }: AuthDialogProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const result = await signInWithPassword(formData);
    
    setIsLoading(false);

    if (result.error) {
      setError("Email ou mot de passe incorrect.");
      toast({
        title: "Échec de la connexion",
        description: "Veuillez vérifier vos identifiants.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });
      onAuthenticated();
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError("");
      setIsLoading(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Connexion
            </DialogTitle>
            <DialogDescription>
              Entrez vos identifiants pour accéder à votre compte.
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
                required
                className="col-span-3"
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
              />
            </div>
            {error && <p className="col-span-4 text-center text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
