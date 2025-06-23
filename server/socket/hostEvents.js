const {
  getGame,
  updateGame,
  getCurrentQuestion,
} = require("../services/gameService");

function setupHostEvents(socket, io) {
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

  // Start game
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

  // Host reveals answer manually
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
          playerName: "Host",
          game: updatedGame,
          byHost: true,
        });
      }
    }
  });

  // Add strike manually
  socket.on("add-strike", (data) => {
    const { gameCode, teamId } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      const team = game.teams.find((t) => t.id === teamId);
      if (team && team.strikes < 3) {
        team.strikes += 1;

        if (team.strikes >= 3) {
          game.teams.forEach((t) => {
            t.active = !t.active;
            t.strikes = 0;
          });
        }

        const updatedGame = updateGame(gameCode, game);
        io.to(gameCode).emit("strike-added", { game: updatedGame });
      }
    }
  });

  // Award points manually
  socket.on("award-points", (data) => {
    const { gameCode, teamId, points } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      const team = game.teams.find((t) => t.id === teamId);
      if (team) {
        team.score += points;
        const updatedGame = updateGame(gameCode, game);
        io.to(gameCode).emit("points-awarded", { game: updatedGame });
      }
    }
  });

  // Switch teams
  socket.on("switch-teams", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      game.teams.forEach((team) => {
        team.active = !team.active;
        team.strikes = 0;
      });

      const updatedGame = updateGame(gameCode, game);
      io.to(gameCode).emit("team-switched", { game: updatedGame });
    }
  });

  // Clear buzzer
  socket.on("clear-buzzer", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game && game.hostId === socket.id) {
      game.currentBuzzer = null;
      const updatedGame = updateGame(gameCode, game);
      io.to(gameCode).emit("buzzer-cleared", { game: updatedGame });
      console.log(`🔄 Buzzer cleared by host in game: ${gameCode}`);
    }
  });

  // Next question
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
        game.teams.forEach((team) => (team.strikes = 0));
        game.teams[0].active = true;
        game.teams[1].active = false;

        const updatedGame = updateGame(gameCode, game);
        io.to(gameCode).emit("next-question", {
          game: updatedGame,
          currentQuestion: getCurrentQuestion(updatedGame),
        });

        console.log(`➡️ Next question: ${game.currentQuestionIndex + 1}`);
      }
    }
  });
}

module.exports = { setupHostEvents };
