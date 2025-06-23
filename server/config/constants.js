// Server constants and configuration

const GAME_CONSTANTS = {
  MAX_PLAYERS_PER_GAME: 10,
  MAX_TEAMS: 2,
  MAX_STRIKES: 3,
  ANSWER_TIME_LIMIT: 30000, // 30 seconds in milliseconds
  AUTO_ADVANCE_DELAY: 2500, // 2.5 seconds
  BUZZER_RESET_DELAY: 1500, // 1.5 seconds
  GAME_CLEANUP_INTERVAL: 3600000, // 1 hour in milliseconds
};

const GAME_STATUS = {
  WAITING: "waiting",
  ACTIVE: "active",
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
  ADD_STRIKE: "add-strike",
  STRIKE_ADDED: "strike-added",
  AWARD_POINTS: "award-points",
  POINTS_AWARDED: "points-awarded",
  SWITCH_TEAMS: "switch-teams",
  TEAM_SWITCHED: "team-switched",
  CLEAR_BUZZER: "clear-buzzer",
  BUZZER_CLEARED: "buzzer-cleared",
  NEXT_QUESTION: "next-question",

  // Player events
  PLAYER_JOIN: "player-join",
  PLAYER_JOINED: "player-joined",
  JOIN_TEAM: "join-team",
  TEAM_UPDATED: "team-updated",
  BUZZ_IN: "buzz-in",
  PLAYER_BUZZED: "player-buzzed",
  BUZZ_TOO_LATE: "buzz-too-late",
  SUBMIT_ANSWER: "submit-answer",
  WRONG_ANSWER: "wrong-answer",

  // Game events
  GAME_OVER: "game-over",
  TEAM_OUT: "team-out",
  QUESTION_CLOSED: "question-closed",
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
  BUZZER_ALREADY_PRESSED: "Someone has already buzzed in",
  NOT_YOUR_TURN: "It's not your turn to answer",
};

const SUCCESS_MESSAGES = {
  GAME_CREATED: "Game created successfully",
  PLAYER_JOINED: "Player joined successfully",
  GAME_STARTED: "Game started successfully",
  ANSWER_CORRECT: "Correct answer!",
  ANSWER_INCORRECT: "Incorrect answer",
  TEAM_SWITCHED: "Teams switched",
  BUZZER_CLEARED: "Buzzer cleared",
};

const TEAM_DEFAULTS = {
  TEAM_1: {
    name: "Team Red",
    members: ["Captain Red", "", "", "", ""],
  },
  TEAM_2: {
    name: "Team Blue",
    members: ["Captain Blue", "", "", "", ""],
  },
};

module.exports = {
  GAME_CONSTANTS,
  GAME_STATUS,
  SOCKET_EVENTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TEAM_DEFAULTS,
};
