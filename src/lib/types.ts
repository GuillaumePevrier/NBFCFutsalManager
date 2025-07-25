export interface Player {
  id: string;
  name: string;
  avatar: string;
}

export interface PlayerPosition extends Player {
  position: { x: number; y: number };
}

export type Role = 'coach' | 'player';

export interface MatchDetails {
  opponent: string;
  date: string;
  time: string;
  location: string;
  remarks: string;
}
