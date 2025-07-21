import { v4 as uuidv4 } from "uuid";
import { GameQuestion } from "../models/gameQuestion.model.js";

// In-memory storage
export let games = {};
export let players = {};

// Generate random game code
export function generateGameCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Initialize question data structure
export function initializeQuestionData() {
  return {
    team1: {
      round1: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round2: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round3: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
    },
    team2: {
      round1: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round2: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
      round3: [
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
        { firstAttemptCorrect: null, pointsEarned: 0 },
      ],
    },
  };
}

// Get current question based on game state
export function getCurrentQuestion(game) {
  if (game.currentQuestionIndex < game.questions.length) {
    return game.questions[game.currentQuestionIndex];
  }
  return null;
}

// Get questions for a specific team and round
export function getQuestionsForTeamRound(team, round) {
  return filter((q) => q.teamAssignment === team && q.round === round);
}

// Determine next question index based on turn logic
export function getNextQuestionIndex(game) {
  const currentQuestion = getCurrentQuestion(game);
  if (!currentQuestion) return game.currentQuestionIndex;

  const currentTeam = game.gameState.currentTurn;
  const questionsAnswered = game.gameState.questionsAnswered[currentTeam];

  // If current team has answered all 3 questions, switch to other team
  if (questionsAnswered >= 3) {
    if (currentTeam === "team1") {
      // Switch to team2, find their first question for current round
      const team2Questions = game.questions.filter(
        (q) => q.teamAssignment === "team2" && q.round === game.currentRound
      );
      if (team2Questions.length > 0) {
        return game.questions.findIndex((q) => q.id === team2Questions[0].id);
      }
    } else {
      // Team2 finished, move to round summary or next round
      return game.currentQuestionIndex + 1;
    }
  } else {
    // Continue with current team's next question
    const teamQuestions = game.questions.filter(
      (q) => q.teamAssignment === currentTeam && q.round === game.currentRound
    );
    const nextTeamQuestion = teamQuestions[questionsAnswered];
    if (nextTeamQuestion) {
      return game.questions.findIndex((q) => q.id === nextTeamQuestion.id);
    }
  }

  return game.currentQuestionIndex + 1;
}

// Check if round is complete
export function isRoundComplete(game) {
  return (
    game.gameState.questionsAnswered.team1 >= 3 &&
    game.gameState.questionsAnswered.team2 >= 3
  );
}

// Calculate round summary
export function calculateRoundSummary(game) {
  const round = game.currentRound;
  const team1 = game.teams.find(
    (t) => t.id.includes("team1") || t.name.includes("1")
  );
  const team2 = game.teams.find(
    (t) => t.id.includes("team2") || t.name.includes("2")
  );

  return {
    round,
    teamScores: {
      team1: {
        roundScore: team1.currentRoundScore,
        totalScore: team1.score,
        teamName: team1.name,
      },
      team2: {
        roundScore: team2.currentRoundScore,
        totalScore: team2.score,
        teamName: team2.name,
      },
    },
    questionsAnswered: {
      team1: game.questions.filter(
        (q) => q.teamAssignment === "team1" && q.round === round
      ),
      team2: game.questions.filter(
        (q) => q.teamAssignment === "team2" && q.round === round
      ),
    },
  };
}

// Start new round
export function startNewRound(game) {
  game.currentRound += 1;
  game.gameState.questionsAnswered.team1 = 0;
  game.gameState.questionsAnswered.team2 = 0;
  game.gameState.currentTurn = "team1"; // Team 1 always starts each round

  // Reset round scores
  game.teams.forEach((team) => {
    team.currentRoundScore = 0;
  });

  // Set to first question of new round for team1
  const team1FirstQuestion = game.questions.find(
    (q) => q.teamAssignment === "team1" && q.round === game.currentRound
  );

  if (team1FirstQuestion) {
    game.currentQuestionIndex = game.questions.findIndex(
      (q) => q.id === team1FirstQuestion.id
    );
  }

  // Update team active status
  updateTeamActiveStatus(game);
}

// Update which team is active
export function updateTeamActiveStatus(game) {
  game.teams.forEach((team) => {
    if (game.gameState.currentTurn === "team1") {
      team.active = team.id.includes("team1") || team.name.includes("1");
    } else if (game.gameState.currentTurn === "team2") {
      team.active = team.id.includes("team2") || team.name.includes("2");
    } else {
      team.active = false;
    }
  });
}

// Create a new game (SINGLE ATTEMPT + Question Data)
export async function createGame() {
  const gameCode = generateGameCode();
  const gameId = uuidv4();

  const q = await GameQuestion.find();
  console.log("Questions Fetched: ", q);

  games[gameCode] = {
    id: gameId,
    code: gameCode,
    status: "waiting",
    currentQuestionIndex: 0,
    currentRound: 1,
    questions: JSON.parse(JSON.stringify(q)),
    teams: [
      {
        id: uuidv4() + "_team1",
        name: "Team 1",
        score: 0,
        active: false,
        members: [],
        roundScores: [0, 0, 0],
        currentRoundScore: 0,
      },
      {
        id: uuidv4() + "_team2",
        name: "Team 2",
        score: 0,
        active: false,
        members: [],
        roundScores: [0, 0, 0],
        currentRoundScore: 0,
      },
    ],
    players: [],
    hostId: null,
    createdAt: new Date(),
    gameState: {
      currentTurn: null,
      questionsAnswered: {
        team1: 0,
        team2: 0,
      },
      roundScores: {
        round1: { team1: 0, team2: 0 },
        round2: { team1: 0, team2: 0 },
        round3: { team1: 0, team2: 0 },
      },
      awaitingAnswer: false,
      canAdvance: false,
      questionData: initializeQuestionData(),
    },
  };

  console.log(
    `🎮 Single-attempt game created with question tracking: ${gameCode}`
  );
  return { gameCode, gameId };
}

// Start the game (called by host)
export function startGame(gameCode) {
  const game = games[gameCode];
  if (!game) return null;

  game.status = "active";
  game.gameState.currentTurn = "team1"; // Team 1 starts
  game.gameState.awaitingAnswer = true;

  // Set to first question (should be team1's first question)
  const firstQuestion = game.questions.find(
    (q) =>
      q.teamAssignment === "team1" && q.round === 1 && q.questionNumber === 1
  );

  if (firstQuestion) {
    game.currentQuestionIndex = game.questions.findIndex(
      (q) => q.id === firstQuestion.id
    );
  }

  updateTeamActiveStatus(game);

  return game;
}

// Update question data in game state
export function updateQuestionData(
  game,
  teamKey,
  round,
  questionNumber,
  isCorrect,
  points
) {
  const roundKey = `round${round}`;
  const questionIndex = questionNumber - 1; // Convert to 0-based index

  if (
    game.gameState.questionData[teamKey] &&
    game.gameState.questionData[teamKey][roundKey] &&
    game.gameState.questionData[teamKey][roundKey][questionIndex]
  ) {
    // Only update if this is the first attempt (firstAttemptCorrect is null)
    if (
      game.gameState.questionData[teamKey][roundKey][questionIndex]
        .firstAttemptCorrect === null
    ) {
      game.gameState.questionData[teamKey][roundKey][
        questionIndex
      ].firstAttemptCorrect = isCorrect;
    }

    // Always update points earned (could increase with correct answers)
    game.gameState.questionData[teamKey][roundKey][questionIndex].pointsEarned =
      points;
  }
}

// Submit an answer - UPDATED: Single attempt system
export function submitAnswer(gameCode, playerId, answerText) {
  const game = games[gameCode];
  const player = players[playerId];

  if (!game || !player || game.status !== "active") {
    return { success: false, message: "Invalid game state" };
  }

  const currentQuestion = getCurrentQuestion(game);
  if (!currentQuestion) {
    return { success: false, message: "No current question" };
  }

  // Check if it's the player's team's turn
  const playerTeam = game.teams.find((t) => t.id === player.teamId);
  if (!playerTeam || !playerTeam.active) {
    return { success: false, message: "Not your team's turn" };
  }

  console.log(`📝 Single attempt answer: "${answerText}" by ${player.name}`);

  // Find matching answer
  const matchingAnswer = currentQuestion.answers.find(
    (answer) =>
      !answer.revealed &&
      (answer.answer.toLowerCase().includes(answerText.toLowerCase().trim()) ||
        answerText.toLowerCase().trim().includes(answer.answer.toLowerCase()))
  );

  let result = {
    success: true,
    isCorrect: false,
    pointsAwarded: 0,
    matchingAnswer: null,
    playerName: player.name,
    teamName: playerTeam.name,
    teamId: playerTeam.id,
    game: null,
    shouldAdvance: true, // Always advance after single attempt
    revealAllCards: false,
    revealRemainingAfterDelay: false,
  };

  if (matchingAnswer) {
    // Correct answer - REVEAL THE CORRECT CARD IMMEDIATELY
    matchingAnswer.revealed = true;
    const points = matchingAnswer.points * game.currentRound;

    playerTeam.score += points;
    playerTeam.currentRoundScore += points;

    result.isCorrect = true;
    result.pointsAwarded = points;
    result.matchingAnswer = matchingAnswer;
    result.revealRemainingAfterDelay = true; // Reveal remaining cards after 2 seconds

    // Update question data
    const teamKey = game.gameState.currentTurn;
    const currentRound = game.currentRound;
    const questionNumber = game.gameState.questionsAnswered[teamKey] + 1;
    updateQuestionData(
      game,
      teamKey,
      currentRound,
      questionNumber,
      true,
      points
    );

    console.log(
      `✅ Correct answer: "${answerText}" = "${matchingAnswer.answer}" (+${points} pts) - Will reveal remaining cards after 2s`
    );
  } else {
    // Wrong answer - REVEAL ALL CARDS IMMEDIATELY
    currentQuestion.answers.forEach((answer) => {
      answer.revealed = true;
    });

    result.isCorrect = false;
    result.revealAllCards = true;

    // Update question data for wrong attempt
    const teamKey = game.gameState.currentTurn;
    const currentRound = game.currentRound;
    const questionNumber = game.gameState.questionsAnswered[teamKey] + 1;
    updateQuestionData(game, teamKey, currentRound, questionNumber, false, 0);

    console.log(
      `❌ Wrong answer: "${answerText}" - All cards revealed, moving to next question`
    );
  }

  // Don't advance the game state here - let the socket handler do it after appropriate delays
  result.game = games[gameCode];
  return result;
}

// UPDATED: Advance game state (called after delay) - single attempt system
export function advanceGameState(gameCode) {
  const game = games[gameCode];
  if (!game) return null;

  const currentTeam = game.gameState.currentTurn;

  // Increment questions answered count
  game.gameState.questionsAnswered[currentTeam] += 1;

  // Check if team has answered all 3 questions
  if (game.gameState.questionsAnswered[currentTeam] >= 3) {
    if (currentTeam === "team1") {
      // Switch to team 2
      game.gameState.currentTurn = "team2";
      updateTeamActiveStatus(game);

      // Find team2's first question for current round
      const team2FirstQuestion = game.questions.find(
        (q) =>
          q.teamAssignment === "team2" &&
          q.round === game.currentRound &&
          q.questionNumber === 1
      );

      if (team2FirstQuestion) {
        game.currentQuestionIndex = game.questions.findIndex(
          (q) => q.id === team2FirstQuestion.id
        );
      }
    } else {
      // Team 2 finished - round complete
      if (game.currentRound < 3) {
        game.status = "round-summary";
        game.gameState.currentTurn = null;
        updateTeamActiveStatus(game);
      } else {
        // Game finished
        game.status = "finished";
        game.gameState.currentTurn = null;
        updateTeamActiveStatus(game);
      }
    }
  } else {
    // Continue with same team's next question
    const nextQuestionIndex = getNextQuestionIndex(game);
    game.currentQuestionIndex = nextQuestionIndex;
  }

  return updateGame(gameCode, game);
}

// Continue to next round (from round summary)
export function continueToNextRound(gameCode) {
  const game = games[gameCode];
  if (!game || game.status !== "round-summary") {
    return null;
  }

  // Save round scores
  const roundKey = `round${game.currentRound}`;
  const team1 = game.teams.find((t) => t.id.includes("team1"));
  const team2 = game.teams.find((t) => t.id.includes("team2"));

  if (team1 && team2) {
    game.gameState.roundScores[roundKey] = {
      team1: team1.currentRoundScore,
      team2: team2.currentRoundScore,
    };

    team1.roundScores[game.currentRound - 1] = team1.currentRoundScore;
    team2.roundScores[game.currentRound - 1] = team2.currentRoundScore;
  }

  if (game.currentRound < 3) {
    startNewRound(game);
    game.status = "active";
    game.gameState.awaitingAnswer = true;
  } else {
    game.status = "finished";
  }

  return updateGame(gameCode, game);
}

// Join a game
export function joinGame(gameCode, playerName) {
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
export function getGame(gameCode) {
  return games[gameCode] || null;
}

// Get player by ID
export function getPlayer(playerId) {
  return players[playerId] || null;
}

// Update game
export function updateGame(gameCode, updates) {
  if (games[gameCode]) {
    Object.assign(games[gameCode], updates);
    return games[gameCode];
  }
  return null;
}

// Update player
export function updatePlayer(playerId, updates) {
  if (players[playerId]) {
    Object.assign(players[playerId], updates);
    return players[playerId];
  }
  return null;
}

// Check if answer matches any correct answer
export function checkAnswerMatch(userAnswer, correctAnswers) {
  const normalizedUser = userAnswer.toLowerCase().trim();

  return correctAnswers.find(
    (answer) =>
      !answer.revealed &&
      (answer.text.toLowerCase().includes(normalizedUser) ||
        normalizedUser.includes(answer.text.toLowerCase()))
  );
}

// Get team by assignment string
export function getTeamByAssignment(game, teamAssignment) {
  if (teamAssignment === "team1") {
    return game.teams.find(
      (t) => t.id.includes("team1") || t.name.includes("1")
    );
  } else if (teamAssignment === "team2") {
    return game.teams.find(
      (t) => t.id.includes("team2") || t.name.includes("2")
    );
  }
  return null;
}

// Get current team that should be answering
export function getCurrentActiveTeam(game) {
  return game.teams.find((t) => t.active);
}

// Check if game should end
export function checkGameEnd(game) {
  return (
    game.currentRound > 3 ||
    (game.currentRound === 3 &&
      game.gameState.questionsAnswered.team1 >= 3 &&
      game.gameState.questionsAnswered.team2 >= 3)
  );
}

// Get game winner
export function getGameWinner(game) {
  const team1 = game.teams.find((t) => t.id.includes("team1"));
  const team2 = game.teams.find((t) => t.id.includes("team2"));

  if (!team1 || !team2) return null;

  if (team1.score > team2.score) return team1;
  if (team2.score > team1.score) return team2;
  return null; // Tie
}

// Cleanup old games
export function cleanupOldGames() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  Object.keys(games).forEach((gameCode) => {
    if (games[gameCode].createdAt < oneHourAgo) {
      delete games[gameCode];
      console.log(`🧹 Cleaned up old game: ${gameCode}`);
    }
  });
}

// Handle player disconnect
export function handlePlayerDisconnect(socketId) {
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
export function getGameStats() {
  return {
    activeGames: Object.keys(games).length,
    connectedPlayers: Object.keys(players).length,
  };
}
