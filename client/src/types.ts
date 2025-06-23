// types.ts - Type definitions for the quiz game

export interface Game {
  id: string;
  code: string;
  status: 'waiting' | 'active' | 'finished';
  currentQuestionIndex: number;
  currentRound: number;
  questions: Question[];
  teams: Team[];
  players: Player[];
  hostId: string | null;
  createdAt: Date;
  buzzerState: {
    isOpen: boolean;
    firstTeamBuzzed: string | null;
    currentAnsweringTeam: string | null;
    buzzTimestamp: number | null;
    answerTimeLimit: number;
    answerTimerActive: boolean;
    activeAnswers: {
      text: string;
      points: number;
      foundBy: string;
    }[];
    remainingAnswers: {
      text: string;
      points: number;
    }[];
  };
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
  socketId?: string;
}