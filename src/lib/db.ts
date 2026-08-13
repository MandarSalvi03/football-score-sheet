import Dexie, { type Table } from 'dexie';

export interface Team {
  id?: number;
  name: string;
}

export interface Player {
  id?: number;
  teamId: number;
  number: string;
  name: string;
  isCaptain: boolean; // Indicates if they are the default captain (optional now)
}

export interface Match {
  id?: number;
  date: string;
  teamAId: number;
  teamBId: number;
  teamAName: string;
  teamBName: string;
  referee?: string;
  venue?: string;
  tournament?: string;
  teamAScore: number;
  teamBScore: number;
  status: 'setup' | 'live' | 'finished';
  timer: number;
  createdAt: string;
  updatedAt: string;
  bestDefenderId?: number;
  bestGoalkeeperId?: number;
}

export interface Goal {
  id?: number;
  matchId: number;
  team: 'A' | 'B';
  playerId: number;
  matchTime: string;
  createdAt: string;
}

export interface SFRecord {
  id?: number;
  matchId: number;
  team: 'A' | 'B';
  playerId: number;
  value: string;
}

export interface Signature {
  id?: number;
  matchId: number;
  role: 'teamA' | 'teamB' | 'referee';
  imageData: string;
}

export class ScoreSheetDB extends Dexie {
  teams!: Table<Team, number>;
  matches!: Table<Match, number>;
  players!: Table<Player, number>;
  goals!: Table<Goal, number>;
  sfRecords!: Table<SFRecord, number>;
  signatures!: Table<Signature, number>;

  constructor() {
    // Changed DB name to ensure a clean wipe for the new schema
    super('ScoreSheetDB_v2');
    this.version(1).stores({
      teams: '++id, name',
      matches: '++id, date, status',
      players: '++id, teamId',
      goals: '++id, matchId, team',
      sfRecords: '++id, matchId',
      signatures: '++id, matchId, role'
    });
  }
}

export const db = new ScoreSheetDB();
