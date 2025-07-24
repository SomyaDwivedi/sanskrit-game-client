// Updated Game type interface for turn-based gameplay with 3-attempt rule and question status tracking

export interface QuestionStatus {
  firstAttemptCorrect: boolean | null; // true = correct first attempt, false = incorrect first attempt, null = not attempted
  pointsEarned: number;
}

export interface RoundData {
  round1: QuestionStatus[];
  round2: QuestionStatus[];
  round3: QuestionStatus[];
}

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
  // Turn-based game state with 3-attempt rule
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
    // NEW: 3-attempt rule tracking
    currentQuestionAttempts: number; // Number of attempts made on current question (0-3)
    maxAttemptsPerQuestion: number; // Maximum attempts allowed per question (always 3)
    // NEW: Question status tracking for scoreboard
    questionData: {
      team1: RoundData; // Question status for team 1
      team2: RoundData; // Question status for team 2
    };
  };
}

export interface Question {
  _id: string;
  round: number;
  teamAssignment: "team1" | "team2"; // Which team this question belongs to
  questionNumber: number; // Question number within the team's turn (1, 2, or 3)
  questionCategory: string;
  question: string;
  answers: Answer[];
}

export interface Answer {
  _id?: string;
  answer: string;
  score: number;
  revealed: boolean;
  isCorrect?: boolean;
  rank?: number;
}

export interface Team {
  id: string;
  name: string;
  score: number;
  active: boolean; // True when it's this team's turn
  members: string[];
  // Round-specific tracking
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

// Round summary data
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
  roundSummary?: RoundSummary;
  message?: string;
  reason?: string;
  activeTeam?: "team1" | "team2";
  round?: number;
  currentQuestion?: Question;
  sameTeam?: boolean;
  isGameFinished?: boolean;
  byHost?: boolean;
  // NEW: 3-attempt rule properties
  attemptNumber?: number;
  attemptsRemaining?: number;
  maxAttempts?: number;
  questionFailed?: boolean;
  // NEW: First attempt tracking
  isFirstAttempt?: boolean;
  firstAttemptCorrect?: boolean;
}

// Answer submission event data - UPDATED with 3-attempt rule and first attempt tracking
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
  // NEW: 3-attempt rule data
  attemptNumber: number; // Which attempt this was (1, 2, or 3)
  attemptsRemaining: number; // How many attempts are left
  maxAttempts: number; // Maximum attempts allowed (always 3)
  questionFailed?: boolean; // True if this was the final failed attempt
  // NEW: First attempt tracking
  isFirstAttempt: boolean; // True if this was the first attempt on this question
  firstAttemptCorrect: boolean; // True if first attempt was correct
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

// NEW: Question failed event data (when all 3 attempts are used)
export interface QuestionFailedData {
  game: Game;
  playerName: string;
  teamName: string;
  teamId: string;
  submittedText: string;
  attemptNumber: number;
  maxAttempts: number;
  message: string;
  firstAttemptCorrect: boolean; // Whether the first attempt was correct
}

// Socket events for turn-based system with 3-attempt rule and question status tracking
export interface TurnBasedSocketCallbacks {
  onAnswerCorrect?: (data: AnswerSubmissionData) => void;
  onAnswerIncorrect?: (data: AnswerSubmissionData) => void;
  onTurnChanged?: (data: TurnChangeData) => void;
  onRoundComplete?: (data: RoundCompleteData) => void;
  onRoundStarted?: (data: SocketEventData) => void;
  onQuestionForced?: (data: SocketEventData) => void;
  onGameReset?: (data: SocketEventData) => void;
  onGameOver?: (data: GameOverData) => void;
  // NEW: 3-attempt rule events
  onQuestionFailed?: (data: QuestionFailedData) => void;
}
