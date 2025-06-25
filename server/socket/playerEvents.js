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

  // Player buzzes in - Enhanced for automatic buzzing on answer submission
  socket.on("buzz-in", (data) => {
    const { gameCode, playerId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    if (game && player && game.status === "active") {
      // Check if this is the first buzz for this question
      if (!game.currentBuzzer) {
        const teamId = player.teamId;

        if (teamId) {
          // Set this player's team as the active team automatically
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
            `🔔 ${player.name} (${game.currentBuzzer.teamName}) buzzed in automatically via answer submission`
          );
        }
      } else {
        // Someone else already buzzed in
        socket.emit("buzz-too-late", {
          firstBuzzer: game.currentBuzzer.playerName,
          firstTeam: game.currentBuzzer.teamName,
        });
      }
    }
  });

  // Submit answer - Enhanced with automatic team switching and strike management
  socket.on("submit-answer", (data) => {
    const { gameCode, playerId, answer } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);

    console.log(
      `📝 Answer submitted: "${answer}" by ${player?.name} in game ${gameCode}`
    );

    if (game && game.status === "active" && player && player.teamId) {
      // If no buzzer yet, this player's team gets it automatically
      if (!game.currentBuzzer) {
        console.log("🔔 Auto-buzzing for first answer submission");

        // Auto-buzz in for this player
        game.currentBuzzer = {
          playerId,
          playerName: player.name,
          teamId: player.teamId,
          teamName:
            game.teams.find((t) => t.id === player.teamId)?.name ||
            "Unknown Team",
          timestamp: Date.now(),
        };

        // Set game state
        game.gameState.activeTeamId = player.teamId;
        game.gameState.inputEnabled = true;
        game.gameState.lastBuzzingTeam = player.teamId;
        game.gameState.waitingForOpponent = false;

        // Update team active status
        game.teams.forEach((team) => {
          team.active = team.id === player.teamId;
        });

        // Emit buzz event
        io.to(gameCode).emit("player-buzzed", {
          playerId,
          playerName: player.name,
          teamId: player.teamId,
          teamName: game.currentBuzzer.teamName,
          timestamp: game.currentBuzzer.timestamp,
          game: game,
          autoBuzz: true,
        });
      }

      // Check if this player's team has control
      if (
        game.gameState.activeTeamId === player.teamId &&
        game.gameState.inputEnabled
      ) {
        const currentQuestion = getCurrentQuestion(game);
        if (!currentQuestion) return;

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
            `✅ Correct: "${answer}" by ${player.name} (+${pointValue} pts)`
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
              advanceToNextQuestion(game, gameCode, io);
            } else {
              // More answers to find - reset buzzer for next attempt
              game.currentBuzzer = null;
              game.gameState.activeTeamId = null;
              game.gameState.inputEnabled = false;

              const resetGame = updateGame(gameCode, game);
              io.to(gameCode).emit("buzzer-cleared", {
                game: resetGame,
                reason: "correct-answer-continue",
              });
              console.log("🔄 Buzzer reset - more answers to find");
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
                  message: `${team.name} struck out! ${opponentTeam.name}, it's your turn!`,
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
                } strikes remaining for ${team.name}`,
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
        // Player doesn't have control
        console.log(
          `❌ Player ${player.name} tried to answer but doesn't have control`
        );
        socket.emit("answer-rejected", {
          reason: "not-your-turn",
          message: "It's not your team's turn to answer",
        });
      }
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
