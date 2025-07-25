// Server constants and configuration (NO STRIKES)

const GAME_CONSTANTS = {
  MAX_PLAYERS_PER_GAME: 10,
  MAX_TEAMS: 2,
  MAX_ATTEMPTS_PER_QUESTION: 3, // Changed from MAX_STRIKES
  ANSWER_TIME_LIMIT: 30000, // 30 seconds in milliseconds
  AUTO_ADVANCE_DELAY: 2500, // 2.5 seconds
  BUZZER_RESET_DELAY: 1500, // 1.5 seconds
  GAME_CLEANUP_INTERVAL: 3600000, // 1 hour in milliseconds
};

const GAME_STATUS = {
  WAITING: "waiting",
  ACTIVE: "active",
  ROUND_SUMMARY: "round-summary",
  FINISHED: "finished",
};

const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // Host events
  HOST_JOIN: "host-join",
  HOST_JOINED: "host-joined",
  START_GAME: "start-game",
  GAME_STARTED: "game-started",
  REVEAL_ANSWER: "reveal-answer",
  ANSWER_REVEALED: "answer-revealed",
  REVEAL_ALL_ANSWERS: "reveal-all-answers",
  ANSWERS_REVEALED: "answers-revealed",
  AWARD_POINTS: "award-points",
  POINTS_AWARDED: "points-awarded",
  SWITCH_TEAMS: "switch-teams",
  TEAM_SWITCHED: "team-switched",
  CLEAR_BUZZER: "clear-buzzer",
  BUZZER_CLEARED: "buzzer-cleared",
  NEXT_QUESTION: "next-question",
  FORCE_NEXT_QUESTION: "force-next-question",
  QUESTION_FORCED: "question-forced",
  CONTINUE_TO_NEXT_ROUND: "continue-to-next-round",
  ROUND_STARTED: "round-started",
  ROUND_COMPLETE: "round-complete",
  RESET_GAME: "reset-game",
  GAME_RESET: "game-reset",

  // Player events
  PLAYER_JOIN: "player-join",
  PLAYER_JOINED: "player-joined",
  JOIN_TEAM: "join-team",
  TEAM_UPDATED: "team-updated",
  SUBMIT_ANSWER: "submit-answer",
  ANSWER_CORRECT: "answer-correct",
  ANSWER_INCORRECT: "answer-incorrect",
  ANSWER_REJECTED: "answer-rejected",
  QUESTION_FAILED: "question-failed", // NEW: When all 3 attempts fail
  TURN_CHANGED: "turn-changed",

  // Game events
  GAME_OVER: "game-over",
  GET_PLAYERS: "get-players",
  PLAYERS_LIST: "players-list",
  GET_GAME_STATE: "get-game-state",
  GAME_STATE_UPDATE: "game-state-update",
};

const ERROR_MESSAGES = {
  GAME_NOT_FOUND: "Game not found",
  PLAYER_NOT_FOUND: "Player not found",
  GAME_FULL: "Game is full",
  GAME_ALREADY_STARTED: "Game has already started",
  INVALID_GAME_CODE: "Invalid game code format",
  INVALID_PLAYER_NAME: "Player name must be between 2-20 characters",
  UNAUTHORIZED_ACTION: "You are not authorized to perform this action",
  GAME_NOT_ACTIVE: "Game is not currently active",
  NOT_YOUR_TURN: "It's not your turn to answer",
  MAX_ATTEMPTS_REACHED: "Maximum attempts reached for this question", // Changed from strikes
  INVALID_ANSWER: "Invalid answer format",
  ANSWER_SUBMISSION_FAILED: "Failed to submit answer",
};

const SUCCESS_MESSAGES = {
  GAME_CREATED: "Game created successfully",
  PLAYER_JOINED: "Player joined successfully",
  GAME_STARTED: "Game started successfully",
  ANSWER_CORRECT: "Correct answer!",
  ANSWER_INCORRECT: "Incorrect answer",
  TEAM_SWITCHED: "Teams switched",
  BUZZER_CLEARED: "Buzzer cleared",
  ROUND_COMPLETE: "Round completed",
  GAME_FINISHED: "Game finished",
  QUESTION_ADVANCED: "Moved to next question",
  ATTEMPTS_REMAINING: "attempts remaining", // Changed from strikes
};

const TEAM_DEFAULTS = {
  TEAM_1: {
    name: "Team 1", // Changed from "Team Red"
    members: ["", "", "", "", ""],
  },
  TEAM_2: {
    name: "Team 2", // Changed from "Team Blue"
    members: ["", "", "", "", ""],
  },
};

// Game flow constants
const GAME_FLOW = {
  ROUNDS_PER_GAME: 3,
  QUESTIONS_PER_TEAM_PER_ROUND: 3,
  TOTAL_QUESTIONS_PER_ROUND: 6, // 3 per team
  TOTAL_QUESTIONS_PER_GAME: 18, // 6 per round × 3 rounds
  ATTEMPTS_PER_QUESTION: 3, // Each question allows 3 attempts
};

// Turn-based game constants
const TURN_SYSTEM = {
  TEAM_1_STARTS: true, // Team 1 always starts each round
  ADVANCE_DELAY_MS: 3000, // 3 second delay before advancing
  QUESTION_TIMEOUT_MS: 60000, // 1 minute per question max
  ROUND_BREAK_DURATION_MS: 5000, // 5 second break between rounds
};

export default {
  GAME_CONSTANTS,
  GAME_STATUS,
  SOCKET_EVENTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TEAM_DEFAULTS,
  GAME_FLOW,
  TURN_SYSTEM,
};
