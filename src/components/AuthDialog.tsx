
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
import { Loader2, KeyRound, UserPlus } from "lucide-react";
import { signInWithPassword, signUp } from "@/app/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthenticated: () => void;
}

function SignInForm({ onAuthenticated, onOpenChange }: { onAuthenticated: () => void; onOpenChange: (isOpen: boolean) => void; }) {
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

  return (
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="col-span-4 text-center text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </DialogFooter>
      </form>
  )
}


function SignUpForm({ onAuthenticated, onOpenChange }: { onAuthenticated: () => void; onOpenChange: (isOpen: boolean) => void; }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        setIsLoading(false);
        return;
    }

    const result = await signUp(formData);
    
    setIsLoading(false);

    if (result.error) {
      setError(result.error.message);
      toast({
        title: "Échec de l'inscription",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Inscription réussie !",
        description: "Bienvenue ! Votre compte a été créé. Vous pouvez maintenant vous connecter.",
      });
      onAuthenticated();
      onOpenChange(false); // Or switch to login tab
    }
  };

  return (
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name-signup">Nom complet</Label>
            <Input id="name-signup" name="name" type="text" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signup">Email</Label>
            <Input id="email-signup" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signup">Mot de passe</Label>
            <Input id="password-signup" name="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
          {error && <p className="col-span-4 text-center text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer le compte
          </Button>
        </DialogFooter>
      </form>
  )
}


export default function AuthDialog({ isOpen, onOpenChange, onAuthenticated }: AuthDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
         <Tabs defaultValue="signin" className="w-full">
            <DialogHeader>
                <DialogTitle>
                     <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin"><KeyRound className="mr-2"/>Connexion</TabsTrigger>
                        <TabsTrigger value="signup"><UserPlus className="mr-2"/>Créer un compte</TabsTrigger>
                    </TabsList>
                </DialogTitle>
                <DialogDescription className="pt-2 text-center">
                    Accédez à votre compte ou créez-en un nouveau pour profiter de toutes les fonctionnalités.
                </DialogDescription>
            </DialogHeader>
            <TabsContent value="signin">
                <SignInForm onAuthenticated={onAuthenticated} onOpenChange={onOpenChange} />
            </TabsContent>
            <TabsContent value="signup">
                <SignUpForm onAuthenticated={onAuthenticated} onOpenChange={onOpenChange} />
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
