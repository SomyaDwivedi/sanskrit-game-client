const express = require("express");
const { createGame, joinGame, getGameStats } = require("../services/gameService");

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  const stats = getGameStats();
  res.json({
    message: "Family Feud Quiz Game Server",
    status: "Running",
    activeGames: stats.activeGames,
    connectedPlayers: stats.connectedPlayers,
  });
});

// Create game endpoint
router.post("/api/create-game", (req, res) => {
  try {
    const { gameCode, gameId } = createGame();
    res.json({ gameCode, gameId });
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ error: "Failed to create game" });
  }
});

// Join game endpoint
router.post("/api/join-game", (req, res) => {
  try {
    const { gameCode, playerName } = req.body;

    if (!gameCode || !playerName) {
      return res.status(400).json({ error: "Game code and player name are required" });
    }

    const { playerId, game } = joinGame(gameCode.toUpperCase(), playerName.trim());
    res.json({ playerId, game });
  } catch (error) {
    console.error("Error joining game:", error);
    if (error.message === "Game not found") {
      res.status(404).json({ error: "Game not found" });
    } else {
      res.status(500).json({ error: "Failed to join game" });
    }
  }
});

module.exports = router;