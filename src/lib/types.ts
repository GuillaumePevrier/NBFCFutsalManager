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

export interface Scoreboard {
  homeScore: number;
  awayScore: number;
  homeFouls: number;
  awayFouls: number;
  time: number; // in seconds
  isRunning: boolean;
  period: number;
}
