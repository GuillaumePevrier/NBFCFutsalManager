'use client';

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, ShieldCheck } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
    onCoachClick: () => void;
    children?: React.ReactNode;
}

export default function Header({ onCoachClick, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-2 border-b bg-card">
      <div className="flex items-center gap-3">
        <Image 
            src="/logo.png" 
            alt="Club Logo" 
            width={40} 
            height={40} 
            className="rounded-sm"
        />
      </div>
      <div className="flex items-center gap-2">
      {children}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onCoachClick}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Mode Coach</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="https://futsal.noyalbrecefc.com/" target="_blank" rel="noopener noreferrer">
                Site du Club
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
