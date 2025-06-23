const { getGame, getPlayer, updateGame, updatePlayer, getCurrentQuestion } = require("../services/gameService");

function setupPlayerEvents(socket, io) {
  // Player joins game room
  socket.on("player-join", (data) => {
    const { gameCode, playerId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);
    
    if (game && player) {
      socket.join(gameCode);
      updatePlayer(playerId, { socketId: socket.id });

      io.to(gameCode).emit("player-joined", {
        player: player,
        totalPlayers: game.players.length,
      });

      console.log(`👤 Player joined room: ${player.name}`);
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

  // Player buzzes in
  socket.on('buzz-in', (data) => {
    const { gameCode, playerId } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);
    
    if (game && player && game.status === 'active') {
      // Check if this is the first buzz for this question
      if (!game.currentBuzzer) {
        const teamId = player.teamId;
        
        if (teamId) {
          // Set this player's team as the active team automatically
          game.teams.forEach(team => {
            team.active = (team.id === teamId);
          });
          
          // Track the current buzzer
          game.currentBuzzer = {
            playerId,
            playerName: player.name,
            teamId,
            teamName: game.teams.find(t => t.id === teamId)?.name || 'Unknown Team',
            timestamp: Date.now()
          };
          
          const updatedGame = updateGame(gameCode, game);
          
          // Emit the buzz event to all clients
          io.to(gameCode).emit('player-buzzed', {
            playerId,
            playerName: player.name,
            teamId: player.teamId,
            teamName: game.currentBuzzer.teamName,
            timestamp: game.currentBuzzer.timestamp,
            game: updatedGame
          });
          
          console.log(`🔔 First Buzz: ${player.name} (${game.currentBuzzer.teamName})`);
        }
      } else {
        // Someone else already buzzed in, send a "too late" event just to this player
        const firstBuzzer = getPlayer(game.currentBuzzer.playerId);
        socket.emit('buzz-too-late', {
          firstBuzzer: firstBuzzer?.name || 'Unknown Player'
        });
      }
    }
  });

  // Submit answer
  socket.on('submit-answer', (data) => {
    const { gameCode, playerId, answer } = data;
    const game = getGame(gameCode);
    const player = getPlayer(playerId);
    
    if (game && game.status === 'active' && game.currentBuzzer && game.currentBuzzer.playerId === playerId) {
      const currentQuestion = getCurrentQuestion(game);
      if (!currentQuestion) return;
      
      // Find a matching answer (case insensitive partial match)
      const matchingAnswer = currentQuestion.answers.find(a => 
        !a.revealed && (
          a.text.toLowerCase().includes(answer.toLowerCase().trim()) ||
          answer.toLowerCase().trim().includes(a.text.toLowerCase())
        )
      );
      
      if (matchingAnswer) {
        // Correct answer!
        matchingAnswer.revealed = true;
        
        const team = game.teams.find(t => t.id === player.teamId);
        
        if (team) {
          // Award points based on the point value * round multiplier
          const pointValue = matchingAnswer.points * game.currentRound;
          team.score += pointValue;
          
          const updatedGame = updateGame(gameCode, game);
          
          io.to(gameCode).emit('answer-revealed', {
            answer: matchingAnswer,
            playerName: player.name,
            teamName: team.name,
            pointsAwarded: pointValue,
            game: updatedGame
          });
          
          console.log(`✅ Correct: ${answer} by ${player.name} (+${pointValue} pts)`);
          
          // Automatically move to next question after a short delay
          setTimeout(() => {
            // Check if all answers revealed or if this was the last answer
            const allRevealed = currentQuestion.answers.every(a => a.revealed);
            if (allRevealed || matchingAnswer.points >= 40) {
              // Move to next question
              game.currentQuestionIndex += 1;
              
              // Update round
              const nextQuestion = getCurrentQuestion(game);
              if (nextQuestion) {
                game.currentRound = nextQuestion.round;
                // Reset buzzer for new question
                game.currentBuzzer = null;
                
                // Alternate which team starts active for each new question
                const alternateStart = game.currentQuestionIndex % 2 === 0;
                game.teams[0].active = alternateStart;
                game.teams[1].active = !alternateStart;
                
                const finalGame = updateGame(gameCode, game);
                
                io.to(gameCode).emit('next-question', {
                  game: finalGame,
                  currentQuestion: nextQuestion
                });
                
                console.log(`➡️ Auto advancing to next question: ${game.currentQuestionIndex + 1}`);
              } else {
                // End game if no more questions
                game.status = 'finished';
                const winner = game.teams.reduce((prev, current) => 
                  prev.score > current.score ? prev : current
                );
                
                const finalGame = updateGame(gameCode, game);
                
                io.to(gameCode).emit('game-over', { game: finalGame, winner });
                console.log(`🏆 Game finished: ${gameCode}, Winner: ${winner.name}`);
              }
            } else {
              // Reset buzzer for next answer on same question
              game.currentBuzzer = null;
              const updatedGame = updateGame(gameCode, game);
              io.to(gameCode).emit('buzzer-cleared', { game: updatedGame });
            }
          }, 2500);
        }
      } else {
        // Wrong answer
        const team = game.teams.find(t => t.id === player.teamId);
        
        if (team) {
          // Add strike automatically
          team.strikes += 1;
          
          const updatedGame = updateGame(gameCode, game);
          
          io.to(gameCode).emit('wrong-answer', {
            answer,
            playerName: player.name,
            teamName: team.name,
            strikes: team.strikes,
            game: updatedGame
          });
          
          console.log(`❌ Wrong: ${answer} by ${player.name} (Strike ${team.strikes})`);
          
          // Reset buzzer to allow the other team a chance
          game.currentBuzzer = null;
          
          // After 3 strikes, give chance to other team
          if (team.strikes >= 3) {
            // Switch active teams
            game.teams.forEach(t => {
              t.active = !t.active;
            });
            
            const finalGame = updateGame(gameCode, game);
            
            io.to(gameCode).emit('team-switched', { 
              game: finalGame,
              activeTeamId: game.teams.find(t => t.active)?.id,
              activeTeamName: game.teams.find(t => t.active)?.name
            });
            console.log(`↔️ Team switched after 3 strikes`);
          }
          
          // Reset buzzer
          setTimeout(() => {
            const finalGame = updateGame(gameCode, game);
            io.to(gameCode).emit('buzzer-cleared', { game: finalGame });
          }, 1500);
        }
      }
    }
  });
}

module.exports = { setupPlayerEvents };