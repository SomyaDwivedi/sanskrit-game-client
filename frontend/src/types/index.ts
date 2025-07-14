// Updated Game type interface for turn-based gameplay

export interface Game {
  id: string;
  code: string;
  status: "waiting" | "active" | "round-summary" | "finished";
  currentQuestionIndex: number;
  currentRound: number;
  questions: Question[];
  teams: Team[];
  players: Player[];
  hostId: string | null;
  createdAt: Date;
  // NEW: Turn-based game state
  gameState: {
    currentTurn: "team1" | "team2" | null; // Which team is currently answering
    questionsAnswered: {
      team1: number; // Number of questions answered by team 1 in current round
      team2: number; // Number of questions answered by team 2 in current round
    };
    roundScores: {
      round1: { team1: number; team2: number };
      round2: { team1: number; team2: number };
      round3: { team1: number; team2: number };
    };
    awaitingAnswer: boolean; // True when a team needs to submit an answer
    canAdvance: boolean; // True when ready to move to next question/round
  };
}

export interface Question {
  id: number;
  round: number;
  teamAssignment: "team1" | "team2"; // NEW: Which team this question belongs to
  questionNumber: number; // NEW: Question number within the team's turn (1, 2, or 3)
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
  active: boolean; // True when it's this team's turn
  members: string[];
  // NEW: Round-specific tracking
  roundScores: number[]; // Score for each round [round1, round2, round3]
  currentRoundScore: number; // Score accumulated in current round
}

export interface Player {
  id: string;
  name: string;
  gameCode: string;
  connected: boolean;
  teamId?: string;
  socketId?: string;
}

// NEW: Round summary data
export interface RoundSummary {
  round: number;
  teamScores: {
    team1: { roundScore: number; totalScore: number; teamName: string };
    team2: { roundScore: number; totalScore: number; teamName: string };
  };
  questionsAnswered: {
    team1: Question[];
    team2: Question[];
  };
}

// Base socket event data types
export interface SocketEventData {
  game: Game;
  playerName?: string;
  teamName?: string;
  teamId?: string;
  playerId?: string;
  pointsAwarded?: number;
  isCorrect?: boolean;
  strikes?: number;
  roundSummary?: RoundSummary;
  message?: string;
  reason?: string;
  activeTeam?: "team1" | "team2";
  round?: number;
  currentQuestion?: Question;
  sameTeam?: boolean;
  isGameFinished?: boolean;
  byHost?: boolean;
}

// Answer submission event data - FIXED: Removed conflicting properties
export interface AnswerSubmissionData {
  game: Game;
  playerName: string;
  teamName: string;
  teamId: string;
  submittedText: string; // The actual text the player submitted
  matchingAnswer: Answer | null; // The matching answer object if found
  pointsAwarded: number;
  isCorrect: boolean;
  totalTeamScore: number;
  currentRoundScore: number;
  strikes?: number;
}

// Round completion event data
export interface RoundCompleteData {
  game: Game;
  roundSummary: RoundSummary;
  isGameFinished: boolean;
}

// Turn change event data
export interface TurnChangeData {
  game: Game;
  newActiveTeam: "team1" | "team2";
  teamName: string;
  questionNumber: number;
  round: number;
  currentQuestion?: Question;
}

// Game over event data
export interface GameOverData {
  game: Game;
  winner: Team | null;
  finalScores: {
    team1: number;
    team2: number;
  };
}

// New socket events for turn-based system
export interface TurnBasedSocketCallbacks {
  onAnswerCorrect?: (data: AnswerSubmissionData) => void;
  onAnswerIncorrect?: (data: AnswerSubmissionData) => void;
  onTurnChanged?: (data: TurnChangeData) => void;
  onRoundComplete?: (data: RoundCompleteData) => void;
  onRoundStarted?: (data: SocketEventData) => void;
  onQuestionForced?: (data: SocketEventData) => void;
  onGameReset?: (data: SocketEventData) => void;
  onGameOver?: (data: GameOverData) => void;
}
