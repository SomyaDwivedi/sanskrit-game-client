const {
  getGame,
  getPlayer,
  updateGame,
  updatePlayer,
  getCurrentQuestion,
} = require("../services/gameService");

function setupPlayerEvents(socket, io) {
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
        updateGame(gameCode, game);
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

  // Player buzzes in - ENHANCED: Now separate from answer submission
  socket.on("buzz-in", (data) => {
    const { gameCode, playerId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    console.log(
      `🔔 Player attempting to buzz in: ${player?.name} in game ${gameCode}`
    );

    if (game && player && game.status === "active") {
      // Check if this is the first buzz for this question
      if (!game.currentBuzzer) {
        const teamId = player.teamId;

        if (teamId) {
          console.log(
            `✅ ${player.name} successfully buzzed in for their team!`
          );

          // Set this player's team as the active team
          game.teams.forEach((team) => {
            team.active = team.id === teamId;
          });

          // Track the current buzzer
          game.currentBuzzer = {
            playerId,
            playerName: player.name,
            teamId,
            teamName:
              game.teams.find((t) => t.id === teamId)?.name || "Unknown Team",
            timestamp: Date.now(),
          };

          // Update game state for answer input mechanics
          game.gameState.activeTeamId = teamId;
          game.gameState.inputEnabled = true;
          game.gameState.lastBuzzingTeam = teamId;
          game.gameState.waitingForOpponent = false;

          const updatedGame = updateGame(gameCode, game);

          // Emit the buzz event to all clients
          io.to(gameCode).emit("player-buzzed", {
            playerId,
            playerName: player.name,
            teamId: player.teamId,
            teamName: game.currentBuzzer.teamName,
            timestamp: game.currentBuzzer.timestamp,
            game: updatedGame,
          });

          console.log(
            `🔔 ${player.name} (${game.currentBuzzer.teamName}) buzzed in first!`
          );
        } else {
          console.log(
            `❌ Player ${player.name} attempted to buzz but has no team`
          );
          socket.emit("buzz-rejected", {
            reason: "no-team",
            message: "You must join a team before buzzing in",
          });
        }
      } else {
        // Someone else already buzzed in
        console.log(
          `❌ ${player.name} buzzed too late - ${game.currentBuzzer.playerName} got there first`
        );
        socket.emit("buzz-too-late", {
          firstBuzzer: game.currentBuzzer.playerName,
          firstTeam: game.currentBuzzer.teamName,
          message: `${game.currentBuzzer.playerName} (${game.currentBuzzer.teamName}) buzzed in first!`,
        });
      }
    } else {
      console.log(
        `❌ Buzz rejected: game active=${
          game?.status === "active"
        }, player exists=${!!player}, game exists=${!!game}`
      );
      socket.emit("buzz-rejected", {
        reason: "invalid-state",
        message: "Cannot buzz at this time - game may not be active",
      });
    }
  });

  // Submit answer - ENHANCED: Now requires buzzer control first
  socket.on("submit-answer", (data) => {
    const { gameCode, playerId, answer } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    console.log(
      `📝 Answer submitted: "${answer}" by ${player?.name} in game ${gameCode}`
    );

    if (game && game.status === "active" && player && player.teamId) {
      // Check if this player's team has control AND input is enabled
      if (
        game.currentBuzzer &&
        game.currentBuzzer.teamId === player.teamId &&
        game.gameState.activeTeamId === player.teamId &&
        game.gameState.inputEnabled
      ) {
        console.log(
          `✅ ${player.name} has buzzer control and can submit answers`
        );

        const currentQuestion = getCurrentQuestion(game);
        if (!currentQuestion) {
          console.log(`❌ No current question found`);
          return;
        }

        // Find a matching answer (case insensitive partial match)
        const matchingAnswer = currentQuestion.answers.find(
          (a) =>
            !a.revealed &&
            (a.text.toLowerCase().includes(answer.toLowerCase().trim()) ||
              answer.toLowerCase().trim().includes(a.text.toLowerCase()))
        );

        const team = game.teams.find((t) => t.id === player.teamId);

        if (matchingAnswer && team) {
          // ✅ CORRECT ANSWER!
          matchingAnswer.revealed = true;

          // Award points based on the point value * round multiplier
          const pointValue = matchingAnswer.points * game.currentRound;
          team.score += pointValue;

          console.log(
            `✅ Correct: "${answer}" matches "${matchingAnswer.text}" by ${player.name} (+${pointValue} pts)`
          );

          const updatedGame = updateGame(gameCode, game);

          io.to(gameCode).emit("answer-revealed", {
            answer: matchingAnswer,
            playerName: player.name,
            teamName: team.name,
            pointsAwarded: pointValue,
            game: updatedGame,
            correct: true,
          });

          // Check if should continue or move to next question
          setTimeout(() => {
            const allRevealed = currentQuestion.answers.every(
              (a) => a.revealed
            );

            if (allRevealed) {
              // All answers found - move to next question
              console.log(
                `🎯 All answers revealed! Moving to next question...`
              );
              advanceToNextQuestion(game, gameCode, io);
            } else {
              // More answers to find - reset buzzer for next attempt
              console.log(
                `🔄 Correct answer! Resetting buzzer for next answer...`
              );
              game.currentBuzzer = null;
              game.gameState.activeTeamId = null;
              game.gameState.inputEnabled = false;

              const resetGame = updateGame(gameCode, game);
              io.to(gameCode).emit("buzzer-cleared", {
                game: resetGame,
                reason: "correct-answer-continue",
                message:
                  "Correct! More answers remaining - buzz in for the next one!",
              });
            }
          }, 2000);
        } else if (team) {
          // ❌ WRONG ANSWER - Add strike automatically
          team.strikes += 1;

          console.log(
            `❌ Wrong: "${answer}" by ${player.name} (Strike ${team.strikes}/3)`
          );

          const updatedGame = updateGame(gameCode, game);

          io.to(gameCode).emit("wrong-answer", {
            answer,
            playerName: player.name,
            teamName: team.name,
            strikes: team.strikes,
            game: updatedGame,
          });

          // Handle automatic team switching after 3 strikes
          if (team.strikes >= 3) {
            console.log(`💔 ${team.name} struck out! Auto-switching teams...`);

            // Find opponent team
            const opponentTeam = game.teams.find((t) => t.id !== team.id);

            if (opponentTeam) {
              // Switch active teams
              game.teams.forEach((t) => {
                t.active = t.id === opponentTeam.id;
              });

              // Give control to opponent team
              game.gameState.activeTeamId = opponentTeam.id;
              game.gameState.inputEnabled = true;
              game.gameState.waitingForOpponent = false;

              // Clear current buzzer
              game.currentBuzzer = null;

              const finalGame = updateGame(gameCode, game);

              setTimeout(() => {
                io.to(gameCode).emit("team-switched", {
                  game: finalGame,
                  activeTeamId: opponentTeam.id,
                  activeTeamName: opponentTeam.name,
                  reason: "automatic-strikes",
                  message: `${team.name} struck out! ${opponentTeam.name}, it's your turn to buzz in!`,
                });
              }, 1500);

              console.log(
                `↔️ Auto-switched to ${opponentTeam.name} after 3 strikes`
              );
            }
          } else {
            // Less than 3 strikes - reset buzzer after a delay
            setTimeout(() => {
              game.currentBuzzer = null;
              game.gameState.activeTeamId = null;
              game.gameState.inputEnabled = false;

              const resetGame = updateGame(gameCode, game);
              io.to(gameCode).emit("buzzer-cleared", {
                game: resetGame,
                reason: "wrong-answer",
                message: `Wrong answer! ${
                  3 - team.strikes
                } strikes remaining for ${team.name}. Buzzer is now open!`,
              });
              console.log(
                `🔄 Buzzer reset - ${3 - team.strikes} strikes remaining for ${
                  team.name
                }`
              );
            }, 1500);
          }
        }
      } else {
        // Player doesn't have control or buzzer access
        console.log(
          `❌ Player ${player.name} tried to answer but doesn't have buzzer control`
        );

        let reason = "unknown";
        let message = "Cannot submit answer at this time";

        if (!game.currentBuzzer) {
          reason = "no-buzzer";
          message = "You must buzz in first before submitting an answer";
        } else if (game.currentBuzzer.teamId !== player.teamId) {
          reason = "wrong-team";
          message = `${game.currentBuzzer.teamName} has control - wait for your turn`;
        } else if (!game.gameState.inputEnabled) {
          reason = "input-disabled";
          message = "Answer input is currently disabled";
        }

        socket.emit("answer-rejected", {
          reason,
          message,
          currentBuzzer: game.currentBuzzer,
        });
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

// Helper function to advance to next question
function advanceToNextQuestion(game, gameCode, io) {
  game.currentQuestionIndex += 1;

  // Update round
  const nextQuestion = getCurrentQuestion(game);
  if (nextQuestion) {
    game.currentRound = nextQuestion.round;

    // Reset all game state for new question
    game.currentBuzzer = null;
    game.gameState.activeTeamId = null;
    game.gameState.inputEnabled = false;
    game.gameState.lastBuzzingTeam = null;
    game.gameState.waitingForOpponent = false;

    // Reset team strikes for new question
    game.teams.forEach((t) => (t.strikes = 0));

    // Alternate which team starts active for each new question
    const alternateStart = game.currentQuestionIndex % 2 === 0;
    game.teams[0].active = alternateStart;
    game.teams[1].active = !alternateStart;

    const finalGame = updateGame(gameCode, game);

    io.to(gameCode).emit("next-question", {
      game: finalGame,
      currentQuestion: nextQuestion,
    });

    console.log(
      `➡️ Auto advanced to question ${game.currentQuestionIndex + 1}`
    );
  } else {
    // End game if no more questions
    game.status = "finished";
    const winner = game.teams.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    const finalGame = updateGame(gameCode, game);

    io.to(gameCode).emit("game-over", { game: finalGame, winner });
    console.log(`🏆 Game finished: ${gameCode}, Winner: ${winner.name}`);
  }
}

module.exports = { setupPlayerEvents };
