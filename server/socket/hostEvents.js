const {
  getGame,
  updateGame,
  getCurrentQuestion,
} = require("../services/gameService");

function setupHostEvents(socket, io) {

  // Host marks answer as correct
socket.on("host-mark-correct", (data) => {
  const { gameCode, playerId, teamId } = data;
  const game = getGame(gameCode);
  
  if (game && game.hostId === socket.id) {
    const currentQuestion = getCurrentQuestion(game);
    if (!currentQuestion) return;
    
    // Find the team
    const team = game.teams.find(t => t.id === teamId);
    if (!team) return;
    
    // Get first unrevealed answer to mark as correct
    const firstUnrevealedAnswer = currentQuestion.answers.find(a => !a.revealed);
    
    if (firstUnrevealedAnswer) {
      // Reveal the answer
      firstUnrevealedAnswer.revealed = true;
      
      // Award points
      const pointValue = firstUnrevealedAnswer.points * game.currentRound;
      team.score += pointValue;
      
      const updatedGame = updateGame(gameCode, game);
      
      io.to(gameCode).emit("answer-correct", {
        answer: firstUnrevealedAnswer,
        playerName: game.currentBuzzer?.playerName || "Player",
        teamName: team.name,
        pointsAwarded: pointValue,
        game: updatedGame
      });
      
      // Check if all answers revealed
      setTimeout(() => {
        const allRevealed = currentQuestion.answers.every(a => a.revealed);
        
        if (allRevealed) {
          // All answers found - move to next question
          advanceToNextQuestion(game, gameCode, io);
        } else {
          // More answers to find - reset buzzer
          game.currentBuzzer = null;
          game.gameState.activeTeamId = null;
          game.gameState.inputEnabled = false;
          
          const resetGame = updateGame(gameCode, game);
          io.to(gameCode).emit("buzzer-cleared", {
            game: resetGame,
            reason: "correct-answer-continue",
            message: "Correct! More answers remaining - buzz in for the next one!"
          });
        }
      }, 2000);
    }
  }
});

// Host marks answer as incorrect
socket.on("host-mark-incorrect", (data) => {
  const { gameCode, playerId, teamId } = data;
  const game = getGame(gameCode);
  
  if (game && game.hostId === socket.id) {
    // Find the team
    const team = game.teams.find(t => t.id === teamId);
    if (!team) return;
    
    // Add strike
    team.strikes += 1;
    
    const updatedGame = updateGame(gameCode, game);
    
    io.to(gameCode).emit("wrong-answer", {
      playerName: game.currentBuzzer?.playerName || "Player",
      teamName: team.name,
      strikes: team.strikes,
      game: updatedGame
    });
    
    // Handle automatic team switching after 3 strikes
    if (team.strikes >= 3) {
      // Find opponent team
      const opponentTeam = game.teams.find(t => t.id !== team.id);
      
      if (opponentTeam) {
        // Switch active teams
        game.teams.forEach(t => {
          t.active = t.id === opponentTeam.id;
        });
        
        // Give control to opponent team
        game.gameState.activeTeamId = opponentTeam.id;
        game.gameState.inputEnabled = true;
        
        const switchedGame = updateGame(gameCode, game);
        
        io.to(gameCode).emit("team-switched", {
          game: switchedGame,
          activeTeamName: opponentTeam.name
        });
      }
    } else {
      // Reset buzzer for next attempt
      setTimeout(() => {
        game.currentBuzzer = null;
        game.gameState.activeTeamId = null;
        game.gameState.inputEnabled = false;
        
        const resetGame = updateGame(gameCode, game);
        
        io.to(gameCode).emit("buzzer-cleared", {
          game: resetGame,
          reason: "wrong-answer",
          message: `Wrong answer! ${3 - team.strikes} strikes remaining for ${team.name}. Buzzer is now open!`
        });
      }, 1500);
    }
  }
});

  // Host joins game
  socket.on("host-join", (data) => {
    console.log("👑 Host join event received:", data);
    const { gameCode, teams } = data;
    const game = getGame(gameCode);

    if (game) {
      console.log("🎮 Game found, updating with host data");

      // Update game with host
      const updates = { hostId: socket.id };

      // Update team names and members if provided
      if (teams) {
        updates.teams = [
          {
            ...game.teams[0],
            name: teams[0].name,
            members: teams[0].members.filter((m) => m.trim() !== ""),
          },
          {
            ...game.teams[1],
            name: teams[1].name,
            members: teams[1].members.filter((m) => m.trim() !== ""),
          },
        ];
      }

      const updatedGame = updateGame(gameCode, updates);

      // Join the socket to the game room
      socket.join(gameCode);

      // Send the updated game back to the host
      console.log("📤 Emitting host-joined event with game data");
      socket.emit("host-joined", updatedGame);

      console.log(`👑 Host successfully joined game: ${gameCode}`);
    } else {
      console.error(`❌ Game not found: ${gameCode}`);
      socket.emit("error", { message: "Game not found" });
    }
  });

  // Start game - Initialize game state for new mechanics
  socket.on("start-game", (data) => {
    console.log("🚀 Start game event received:", data);
    const { gameCode } = data;
    const game = getGame(gameCode);

    console.log("Game found:", !!game);
    console.log("Host ID matches:", game?.hostId === socket.id);
    console.log("Current game status:", game?.status);

    if (game && game.hostId === socket.id) {
      console.log("✅ Starting game...");

      // Reset all answers and start game
      const resetQuestions = game.questions.map((q) => ({
        ...q,
        answers: q.answers.map((a) => ({ ...a, revealed: false })),
      }));

      const updates = {
        status: "active",
        currentQuestionIndex: 0,
        questions: resetQuestions,
        currentBuzzer: null,
        // Initialize game state for new mechanics
        gameState: {
          activeTeamId: null,
          inputEnabled: false,
          lastBuzzingTeam: null,
          waitingForOpponent: false,
        },
      };

      const updatedGame = updateGame(gameCode, updates);

      console.log("Updated game status:", updatedGame?.status);
      console.log("Emitting game-started event to room:", gameCode);

      io.to(gameCode).emit("game-started", {
        game: updatedGame,
        currentQuestion: getCurrentQuestion(updatedGame),
      });

      console.log(`🚀 Game started successfully: ${gameCode}`);
    } else {
      console.error("❌ Cannot start game:", {
        gameExists: !!game,
        hostIdMatch: game?.hostId === socket.id,
        expectedHostId: game?.hostId,
        actualSocketId: socket.id,
      });
    }
  });

  // Host reveals answer manually (optional - for override purposes)
  socket.on("reveal-answer", (data) => {
    const { gameCode, answerIndex } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      const currentQuestion = getCurrentQuestion(game);
      if (currentQuestion && currentQuestion.answers[answerIndex]) {
        const answer = currentQuestion.answers[answerIndex];
        answer.revealed = true;

        // Award points to active team
        const activeTeam = game.teams.find((t) => t.active);
        if (activeTeam) {
          activeTeam.score += answer.points * game.currentRound;
        }

        const updatedGame = updateGame(gameCode, game);

        io.to(gameCode).emit("answer-revealed", {
          answer,
          playerName: "Host Override",
          game: updatedGame,
          byHost: true,
        });

        console.log(`👑 Host manually revealed: ${answer.text}`);
      }
    }
  });

  // Clear buzzer (emergency reset)
  socket.on("clear-buzzer", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      game.currentBuzzer = null;
      game.gameState.activeTeamId = null;
      game.gameState.inputEnabled = false;
      game.gameState.lastBuzzingTeam = null;
      game.gameState.waitingForOpponent = false;

      const updatedGame = updateGame(gameCode, game);
      io.to(gameCode).emit("buzzer-cleared", {
        game: updatedGame,
        reason: "host-reset",
      });
      console.log(`🔄 Host manually cleared buzzer in game: ${gameCode}`);
    }
  });

  // Next question (manual advance)
  socket.on("next-question", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      game.currentQuestionIndex += 1;
      game.currentBuzzer = null;

      // Update round
      const currentQuestion = getCurrentQuestion(game);
      if (currentQuestion) {
        game.currentRound = currentQuestion.round;
      }

      if (game.currentQuestionIndex >= game.questions.length) {
        game.status = "finished";
        const winner = game.teams.reduce((prev, current) =>
          prev.score > current.score ? prev : current
        );

        const updatedGame = updateGame(gameCode, game);
        io.to(gameCode).emit("game-over", { game: updatedGame, winner });
        console.log(`🏆 Game finished: ${gameCode}, Winner: ${winner.name}`);
      } else {
        // Reset everything for new question
        game.teams.forEach((team) => {
          team.strikes = 0;
        });
        game.teams[0].active = true;
        game.teams[1].active = false;

        // Reset game state
        game.gameState.activeTeamId = null;
        game.gameState.inputEnabled = false;
        game.gameState.lastBuzzingTeam = null;
        game.gameState.waitingForOpponent = false;

        const updatedGame = updateGame(gameCode, game);
        io.to(gameCode).emit("next-question", {
          game: updatedGame,
          currentQuestion: getCurrentQuestion(updatedGame),
        });

        console.log(
          `➡️ Host advanced to question: ${game.currentQuestionIndex + 1}`
        );
      }
    }
  });
}

module.exports = { setupHostEvents };