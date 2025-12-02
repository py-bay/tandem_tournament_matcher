export interface Player {
  id: string;
  name: string;
  individualScore: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface Team {
  id: string;
  name: string; // "Player A & Player B" or custom
  player1Id: string;
  player2Id: string;
  teamScore: number; // Primary ranking metric
  matchPoints: number; // 2 for win, 1 for draw, 0 for loss (Match outcome)
  buchholz: number; // Tie-breaker
  matchesPlayed: number;
  active: boolean;
}

export interface MatchResult {
  board1: number; // 1 (White Win), 0 (Black Win), 0.5 (Draw), or weighted values (2, 1, etc.)
  board2: number;
}

export interface Match {
  id: string;
  round: number;
  teamAId: string;
  teamBId: string;
  result?: MatchResult;
  isCompleted: boolean;
  tableNumber: number;
}

export interface Round {
  number: number;
  matches: Match[];
  isCompleted: boolean;
}

export interface TournamentState {
  name: string;
  players: Player[];
  teams: Team[];
  rounds: Round[];
  currentRound: number;
  status: 'setup' | 'active' | 'completed';
  mode: 'swiss' | 'round_robin';
  totalRounds?: number;
  weightedFirstGame?: boolean;
}
