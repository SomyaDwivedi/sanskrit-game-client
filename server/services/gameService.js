const { v4: uuidv4 } = require("uuid");
const mockQuestions = require("../data/mockData");

// In-memory storage
let games = {};
let players = {};

// Generate random game code
function generateGameCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Get current question
function getCurrentQuestion(game) {
  if (game.currentQuestionIndex < game.questions.length) {
    return game.questions[game.currentQuestionIndex];
  }
  return null;
}

// Create a new game
// Create a new game
function createGame() {
  const gameCode = generateGameCode();
  const gameId = uuidv4();

  games[gameCode] = {
    id: gameId,
    code: gameCode,
    status: "waiting",
    currentQuestionIndex: 0,
    currentRound: 1,
    questions: JSON.parse(JSON.stringify(mockQuestions)),
    teams: [
      {
        id: uuidv4(),
        name: "Team 1",
        score: 0,
        strikes: 0,
        active: true,
        members: [],
      },
      {
        id: uuidv4(),
        name: "Team 2",
        score: 0,
        strikes: 0,
        active: false,
        members: [],
      },
    ],
    players: [],
    hostId: null,
    createdAt: new Date(),
    currentBuzzer: null,
    buzzerState: {
      isOpen: false,
      firstTeamBuzzed: null,
      currentAnsweringTeam: null,
      buzzTimestamp: null,
      answerTimeLimit: 30000,
      answerTimerActive: false,
      activeAnswers: [],
      remainingAnswers: [],
    },
    // NEW: Game state tracking for answer input mechanics
    gameState: {
      activeTeamId: null, // Which team can currently input answers
      inputEnabled: false, // Whether input is currently enabled
      lastBuzzingTeam: null, // Track who buzzed first for this question
      waitingForOpponent: false, // True when waiting for opponent after strike
    },
  };

  console.log(`🎮 Game created: ${gameCode}`);
  return { gameCode, gameId };
}

// Join a game
function joinGame(gameCode, playerName) {
  if (!games[gameCode]) {
    throw new Error("Game not found");
  }

  const playerId = uuidv4();
  const player = {
    id: playerId,
    name: playerName,
    gameCode,
    connected: true,
    teamId: null,
  };

  players[playerId] = player;
  games[gameCode].players.push(player);

  console.log(`👤 Player joined: ${playerName} in game ${gameCode}`);
  return { playerId, game: games[gameCode] };
}

// Get game by code
function getGame(gameCode) {
  return games[gameCode] || null;
}

// Get player by ID
function getPlayer(playerId) {
  return players[playerId] || null;
}

// Update game
function updateGame(gameCode, updates) {
  if (games[gameCode]) {
    Object.assign(games[gameCode], updates);
    return games[gameCode];
  }
  return null;
}

// Update player
function updatePlayer(playerId, updates) {
  if (players[playerId]) {
    Object.assign(players[playerId], updates);
    return players[playerId];
  }
  return null;
}

// Cleanup old games
function cleanupOldGames() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  Object.keys(games).forEach((gameCode) => {
    if (games[gameCode].createdAt < oneHourAgo) {
      delete games[gameCode];
      console.log(`🧹 Cleaned up old game: ${gameCode}`);
    }
  });
}

// Handle player disconnect
function handlePlayerDisconnect(socketId) {
  Object.values(players).forEach((player) => {
    if (player.socketId === socketId) {
      player.connected = false;
    }
  });

  Object.values(games).forEach((game) => {
    if (game.hostId === socketId) {
      game.hostId = null;
      console.log(`👑 Host disconnected from game: ${game.code}`);
    }
  });
}

// Get game statistics
function getGameStats() {
  return {
    activeGames: Object.keys(games).length,
    connectedPlayers: Object.keys(players).length,
  };
}

module.exports = {
  createGame,
  joinGame,
  getGame,
  getPlayer,
  updateGame,
  updatePlayer,
  getCurrentQuestion,
  cleanupOldGames,
  handlePlayerDisconnect,
  getGameStats,
  games,
  players,
};
