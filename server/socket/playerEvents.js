import {
  getGame,
  getPlayer,
  updatePlayer,
  submitAnswer,
  advanceGameState,
  getCurrentQuestion,
  calculateRoundSummary,
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
  socket.on("submit-answer", (data) => {
    const { gameCode, playerId, answer } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    console.log(
      `📝 Single attempt answer submitted: "${answer}" by ${player?.name} in game ${gameCode}`
    );

    if (game && game.status === "active" && player && player.teamId) {
      // Check if it's this player's team's turn
      const playerTeam = game.teams.find((t) => t.id === player.teamId);
      if (!playerTeam || !playerTeam.active) {
        console.log(`❌ Not ${player.name}'s team turn`);
        socket.emit("answer-rejected", {
          reason: "not-your-turn",
          message: "It's not your team's turn to answer",
        });
        return;
      }

      // Submit the answer - this will handle the single-attempt logic
      const result = submitAnswer(gameCode, playerId, answer);

      if (!result.success) {
        console.log(`❌ Answer submission failed: ${result.message}`);
        socket.emit("answer-rejected", {
          reason: "submission-failed",
          message: result.message,
        });
        return;
      }

      // STEP 1: Immediately emit the result
      if (result.isCorrect) {
        // Correct answer - reveal the correct card immediately
        io.to(gameCode).emit("answer-correct", {
          playerName: result.playerName,
          teamName: result.teamName,
          teamId: result.teamId,
          answer: result.matchingAnswer,
          pointsAwarded: result.pointsAwarded,
          game: result.game,
          submittedText: answer,
          singleAttempt: true,
        });

        console.log(
          `✅ ${result.playerName} answered correctly: +${result.pointsAwarded} points. Correct card revealed!`
        );

        // STEP 2: After 2 seconds, reveal remaining cards
        if (result.revealRemainingAfterDelay) {
          setTimeout(() => {
            console.log(`⏰ 2 seconds elapsed, revealing remaining cards...`);

            // Get updated game and reveal remaining cards
            const updatedGame = getGame(gameCode);
            const currentQuestion = getCurrentQuestion(updatedGame);

            if (currentQuestion) {
              // Reveal all remaining unrevealed cards
              currentQuestion.answers.forEach((answer) => {
                answer.revealed = true;
              });

              io.to(gameCode).emit("remaining-cards-revealed", {
                game: updatedGame,
                currentQuestion: currentQuestion,
              });

              console.log(`👁️ Remaining cards revealed after correct answer`);
            }

            // STEP 3: After revealing remaining cards, advance game state (3 more seconds)
            setTimeout(() => {
              console.log(
                `⏰ Additional 3 seconds elapsed, advancing game state...`
              );

              const advancedGame = advanceGameState(gameCode);
              if (!advancedGame) {
                console.log(`❌ Failed to advance game state for ${gameCode}`);
                return;
              }

              handleGameStateAdvancement(gameCode, advancedGame, io, result);
            }, 3000); // 3 second delay after revealing remaining cards
          }, 2000); // 2 second delay to reveal remaining cards
        }
      } else {
        // Wrong answer - all cards already revealed immediately
        io.to(gameCode).emit("answer-incorrect", {
          playerName: result.playerName,
          teamName: result.teamName,
          teamId: result.teamId,
          submittedText: answer,
          game: result.game,
          message: `Wrong answer. All cards revealed.`,
          singleAttempt: true,
          allCardsRevealed: true,
        });

        console.log(
          `❌ ${result.playerName} answered incorrectly: All cards revealed immediately`
        );

        // STEP 2: After 3 seconds, advance game state
        setTimeout(() => {
          console.log(
            `⏰ 3 seconds elapsed after wrong answer, advancing game state...`
          );

          const advancedGame = advanceGameState(gameCode);
          if (!advancedGame) {
            console.log(`❌ Failed to advance game state for ${gameCode}`);
            return;
          }

          handleGameStateAdvancement(gameCode, advancedGame, io, result);
        }, 3000); // 3 second delay
      }
    } else {
      console.log(`❌ Answer submission failed: Invalid game state or player`);
      socket.emit("answer-rejected", {
        reason: "invalid-state",
        message: "Cannot submit answer - invalid game state",
      });
    }
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
