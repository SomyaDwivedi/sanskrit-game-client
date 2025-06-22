export interface Game {
  id: string;
  code: string;
  status: 'waiting' | 'active' | 'finished';
  currentQuestionIndex: number;
  currentRound: number;
  questions: Question[];
  teams: Team[];
  players: Player[];
}

export interface Question {
  id: number;
  round: number;
  category: string;
  question: string;
  answers: Answer[];
}

export interface Answer {
  text: string;
  points: number;
  revealed: boolean;
}

export interface Team {
  id: string;
  name: string;
  score: number;
  strikes: number;
  active: boolean;
  members: string[];
}

export interface Player {
  id: string;
  name: string;
  gameCode: string;
  connected: boolean;
  teamId?: string;
  isHost?: boolean;
}
