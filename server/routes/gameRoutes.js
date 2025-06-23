const express = require("express");
const { createGame, joinGame, getGameStats } = require("../services/gameService");

const router = express.Router();

// Root endpoint
router.get("/", (req, res) => {
  try {
    const stats = getGameStats();
    res.json({
      message: "Family Feud Quiz Game Server",
      status: "Running",
      activeGames: stats.activeGames,
      connectedPlayers: stats.connectedPlayers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ 
      error: "Failed to get server stats",
      message: "Family Feud Quiz Game Server",
      status: "Running" 
    });
  }
});

// Create game endpoint
router.post("/api/create-game", (req, res) => {
  try {
    console.log("🎮 Create game request received");
    const { gameCode, gameId } = createGame();
    console.log(`✅ Game created successfully: ${gameCode}`);
    res.json({ 
      gameCode, 
      gameId,
      success: true 
    });
  } catch (error) {
    console.error("❌ Error creating game:", error);
    res.status(500).json({ 
      error: "Failed to create game",
      details: error.message 
    });
  }
});

// Join game endpoint
router.post("/api/join-game", (req, res) => {
  try {
    console.log("👤 Join game request received:", req.body);
    const { gameCode, playerName } = req.body;

    if (!gameCode || !playerName) {
      return res.status(400).json({ 
        error: "Game code and player name are required" 
      });
    }

    const { playerId, game } = joinGame(gameCode.toUpperCase(), playerName.trim());
    console.log(`✅ Player joined successfully: ${playerName} in ${gameCode}`);
    res.json({ 
      playerId, 
      game,
      success: true 
    });
  } catch (error) {
    console.error("❌ Error joining game:", error);
    if (error.message === "Game not found") {
      res.status(404).json({ error: "Game not found" });
    } else if (error.message === "Game is full") {
      res.status(400).json({ error: "Game is full" });
    } else {
      res.status(500).json({ 
        error: "Failed to join game",
        details: error.message 
      });
    }
  }
});

module.exports = router;