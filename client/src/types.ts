// Updated Game type interface in types.ts
// This ensures that optional properties are properly marked with ?

export interface Game {
  id: string;
  code: string;
  status: "waiting" | "active" | "finished";
  currentQuestionIndex: number;
  currentRound: number;
  questions: Question[];
  teams: Team[];
  players: Player[];
  hostId: string | null;
  createdAt: Date;
  currentBuzzer?: {
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    timestamp: number;
  } | null;
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

// No change needed for these other interfaces, but included for reference
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
