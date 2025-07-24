import {
  getGame,
  getPlayer,
  updatePlayer,
  submitAnswer,
  updateGame,
  advanceGameState,
  getCurrentQuestion,
  calculateRoundSummary,
  calculateTossUpSummary,
  getGameWinner,
} from "../services/gameService.js";

export function setupPlayerEvents(socket, io) {
  // Player joins game room
  socket.on("player-join", (data) => {
    const { gameCode, playerId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    console.log(`👤 Player join event: ${playerId} trying to join ${gameCode}`);

    if (game && player) {
      socket.join(gameCode);
      updatePlayer(playerId, { socketId: socket.id });

      // Make sure the player is in the game's players array
      const playerExists = game.players.some((p) => p.id === playerId);
      if (!playerExists) {
        game.players.push(player);
        console.log(
          `✅ Added player ${player.name} to game ${gameCode}. Total players: ${game.players.length}`
        );
      }

      // Emit to all players in the room, including the host
      io.to(gameCode).emit("player-joined", {
        player: player,
        totalPlayers: game.players.length,
      });

      console.log(
        `👤 Player ${player.name} joined room ${gameCode}. Total: ${game.players.length}`
      );
    } else {
      console.error(
        `❌ Player join failed: game=${!!game}, player=${!!player}`
      );
    }
  });

  // Request players list (for host)
  socket.on("get-players", (data) => {
    const { gameCode } = data;
    const game = getGame(gameCode);

    if (game) {
      console.log(
        `📋 Host requested players list for ${gameCode}: ${game.players.length} players`
      );
      socket.emit("players-list", {
        players: game.players,
        totalPlayers: game.players.length,
      });
    }
  });

  // Assign player to team
  socket.on("join-team", (data) => {
    const { gameCode, playerId, teamId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    if (game && player) {
      updatePlayer(playerId, { teamId });

      io.to(gameCode).emit("team-updated", {
        playerId,
        teamId,
        game,
      });
    }
  });

  // UPDATED: Submit answer with SINGLE ATTEMPT system
  // UPDATED: Submit answer with SINGLE ATTEMPT system
  socket.on("submit-answer", (data) => {
    const { gameCode, playerId, answer } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    if (!game || !player || game.status !== "active") {
      socket.emit("answer-rejected", {
        reason: "invalid-state",
        message: "Cannot submit answer - invalid game state",
      });
      return;
    }

    const currentRound = game.currentRound ?? 1;

    // ✅ TOSS-UP ROUND (Round 0)
    if (currentRound === 0) {
      if (!game.tossUpAnswers) game.tossUpAnswers = [];
      if (!game.tossUpSubmittedTeams) game.tossUpSubmittedTeams = [];

      const teamId = player.teamId;

      if (game.tossUpSubmittedTeams.includes(teamId)) {
        socket.emit("answer-rejected", {
          reason: "already-answered",
          message: "Your team has already answered the toss-up round.",
        });
        return;
      }

      const result = submitAnswer(gameCode, playerId, answer);
      if (!result.success) {
        socket.emit("answer-rejected", {
          reason: "submission-failed",
          message: result.message,
        });
        return;
      }

      // The service already records the team's answer and marks them as having
      // submitted. Avoid duplicating that state here so the toss-up round waits
      // for both teams correctly.

      // Emit answer result
      if (result.isCorrect) {
        io.to(gameCode).emit("answer-correct", {
          ...result,
          submittedText: answer,
          singleAttempt: true,
        });
      } else {
        io.to(gameCode).emit("answer-incorrect", {
          ...result,
          submittedText: answer,
          singleAttempt: true,
          allCardsRevealed: false,
        });
      }

      // ✅ Both teams have answered — reveal and decide winner
      if (game.tossUpSubmittedTeams.length === 2) {
        setTimeout(() => {
          const currentQuestion = getCurrentQuestion(game);
          if (currentQuestion) {
            currentQuestion.answers.forEach((a) => (a.revealed = true));
            io.to(gameCode).emit("remaining-cards-revealed", {
              game,
              currentQuestion,
            });
          }

          const [answer1, answer2] = game.tossUpAnswers;
          let winnerTeamId = null;

          if (answer1.score > answer2.score) {
            winnerTeamId = answer1.teamId;
          } else if (answer2.score > answer1.score) {
            winnerTeamId = answer2.teamId;
          } else {
            // Tie - use the team that buzzed first
            winnerTeamId = game.buzzedTeamId;
          }

          game.teams.forEach((t) => {
            t.active = false;
          });

          const summary = calculateTossUpSummary(game);

          game.status = "round-summary";
          game.gameState.currentTurn = null;
          game.tossUpWinner = {
            teamId: winnerTeamId,
            teamName: game.teams.find((t) => t.id === winnerTeamId)?.name,
          };

          updateGame(gameCode, game);

          io.to(gameCode).emit("round-complete", {
            game,
            roundSummary: summary,
            isGameFinished: false,
          });

          console.log(`🏆 Toss-up round winner: ${winnerTeamId}`);
        }, 2000);
      } else {
        // ✅ Switch turn to the other team (buzzer logic)
        const [teamA, teamB] = game.teams;
        const otherTeamId = teamA.id === teamId ? teamB.id : teamA.id;

        // Keep the original buzzed team for tie-break purposes but switch the
        // active team to allow the second team to answer.
        game.activeTeamId = otherTeamId;
        game.teams.forEach((t) => (t.active = t.id === otherTeamId));
        game.gameState.inputEnabled = true;
        game.gameState.currentTurn = otherTeamId.includes("team1")
          ? "team1"
          : "team2";

        const updatedGame = updateGame(gameCode, game);

        io.to(gameCode).emit("turn-changed", {
          game: updatedGame,
          newActiveTeam: updatedGame.gameState.currentTurn,
          teamName: updatedGame.teams.find((t) => t.active)?.name || "Unknown",
          currentQuestion: getCurrentQuestion(updatedGame),
        });

        console.log(`🔁 Switching to Team ${otherTeamId}`);
      }

      return;
    }

    // ✅ REGULAR ROUNDS
    const playerTeam = game.teams.find((t) => t.id === player.teamId);
    if (!playerTeam || !playerTeam.active) {
      socket.emit("answer-rejected", {
        reason: "not-your-turn",
        message: "It's not your team's turn to answer",
      });
      return;
    }

    const result = submitAnswer(gameCode, playerId, answer);

    if (!result.success) {
      socket.emit("answer-rejected", {
        reason: "submission-failed",
        message: result.message,
      });
      return;
    }

    if (result.isCorrect) {
      io.to(gameCode).emit("answer-correct", {
        ...result,
        submittedText: answer,
        singleAttempt: true,
      });

      if (result.revealRemainingAfterDelay) {
        setTimeout(() => {
          const updatedGame = getGame(gameCode);
          const currentQuestion = getCurrentQuestion(updatedGame);
          if (currentQuestion) {
            currentQuestion.answers.forEach((a) => (a.revealed = true));
            io.to(gameCode).emit("remaining-cards-revealed", {
              game: updatedGame,
              currentQuestion,
            });
          }

          setTimeout(() => {
            const advancedGame = advanceGameState(gameCode);
            if (advancedGame) {
              handleGameStateAdvancement(gameCode, advancedGame, io, result);
            }
          }, 3000);
        }, 2000);
      }
    } else {
      io.to(gameCode).emit("answer-incorrect", {
        ...result,
        submittedText: answer,
        singleAttempt: true,
        allCardsRevealed: true,
      });

      setTimeout(() => {
        const advancedGame = advanceGameState(gameCode);
        if (advancedGame) {
          handleGameStateAdvancement(gameCode, advancedGame, io, result);
        }
      }, 3000);
    }
  });

  socket.on("player-buzz", ({ gameCode, playerId }) => {
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    if (!game || !player || game.currentRound !== 0 || game.status !== "active")
      return;

    // Only allow buzzer if no team has buzzed yet
    if (game.buzzedTeamId) {
      socket.emit("buzz-too-late", { message: "Another team already buzzed." });
      return;
    }

    // Register the team that buzzed
    game.buzzedTeamId = player.teamId;
    game.teams.forEach((t) => (t.active = t.id === player.teamId));
    const updatedGame = updateGame(gameCode, game);

    io.to(gameCode).emit("buzzer-pressed", {
      game: updatedGame,
      playerId: player.id,
      teamId: player.teamId,
      teamName: updatedGame.teams.find((t) => t.id === player.teamId)?.name,
      playerName: player.name,
    });
  });
}

// Helper function to handle game state advancement logic
export function handleGameStateAdvancement(gameCode, advancedGame, io, result) {
  // Check what happened after advancing
  if (advancedGame.status === "round-summary") {
    // Round completed - emit round summary
    const roundSummary = calculateRoundSummary(advancedGame);

    io.to(gameCode).emit("round-complete", {
      game: advancedGame,
      roundSummary: roundSummary,
      isGameFinished: advancedGame.currentRound >= 3,
    });

    console.log(`🏁 Round ${advancedGame.currentRound} completed`);
  } else if (advancedGame.status === "finished") {
    // Game finished
    const winner = getGameWinner(advancedGame);

    io.to(gameCode).emit("game-over", {
      game: advancedGame,
      winner: winner,
    });

    console.log(`🏆 Game finished: ${gameCode}`);
  } else if (
    advancedGame.gameState.currentTurn !== result.game.gameState.currentTurn
  ) {
    // Turn switched
    const newActiveTeam = advancedGame.teams.find((t) => t.active);

    io.to(gameCode).emit("turn-changed", {
      game: advancedGame,
      newActiveTeam: advancedGame.gameState.currentTurn,
      teamName: newActiveTeam?.name || "Unknown",
      currentQuestion: getCurrentQuestion(advancedGame),
    });

    console.log(`↔️ Turn switched to ${newActiveTeam?.name || "Unknown Team"}`);
  } else {
    // Same team continues with next question
    io.to(gameCode).emit("next-question", {
      game: advancedGame,
      currentQuestion: getCurrentQuestion(advancedGame),
      sameTeam: true,
    });

    console.log(`➡️ ${result.teamName} continues with next question`);
  }
}
