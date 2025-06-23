const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const { v4: uuidv4 } = require("uuid");

const mockQuestions = require("./mockData");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// In-memory game storage
let games = {};
let players = {};

// Generate random game code
function generateGameCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Get current question
function getCurrentQuestion(game) {
  if (game.currentQuestionIndex < game.questions.length) {
    return game.questions[game.currentQuestionIndex];
  }
  return null;
}

// API Routes
app.get("/", (req, res) => {
  res.json({
    message: "Sanskrit Shabd Samvad Game Server",
    status: "Running",
    activeGames: Object.keys(games).length,
    connectedPlayers: Object.keys(players).length,
  });
});

app.post("/api/create-game", (req, res) => {
  const gameCode = generateGameCode();
  const gameId = uuidv4();

  games[gameCode] = {
    id: gameId,
    code: gameCode,
    status: "waiting",
    currentQuestionIndex: 0,
    currentRound: 1,
    questions: JSON.parse(JSON.stringify(mockQuestions)),
    teams: [
      {
        id: uuidv4(),
        name: "Team 1",
        score: 0,
        strikes: 0,
        active: true,
        members: [],
      },
      {
        id: uuidv4(),
        name: "Team 2",
        score: 0,
        strikes: 0,
        active: false,
        members: [],
      },
    ],
    players: [],
    hostId: null,
    createdAt: new Date(),
  };

  console.log(`🎮 Game created: ${gameCode}`);
  res.json({ gameCode, gameId });
});

app.post("/api/join-game", (req, res) => {
  const { gameCode, playerName } = req.body;

  if (!games[gameCode]) {
    return res.status(404).json({ error: "Game not found" });
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
  res.json({ playerId, game: games[gameCode] });
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Host joins game
  socket.on("host-join", (data) => {
    const { gameCode, teams } = data;
    if (games[gameCode]) {
      games[gameCode].hostId = socket.id;

      // Update team names and members if provided
      if (teams) {
        games[gameCode].teams[0].name = teams[0].name;
        games[gameCode].teams[0].members = teams[0].members.filter(
          (m) => m.trim() !== ""
        );
        games[gameCode].teams[1].name = teams[1].name;
        games[gameCode].teams[1].members = teams[1].members.filter(
          (m) => m.trim() !== ""
        );
      }

      socket.join(gameCode);
      socket.emit("host-joined", games[gameCode]);
      console.log(`👑 Host joined game: ${gameCode}`);
    }
  });

  // Player joins game room
  socket.on("player-join", (data) => {
    const { gameCode, playerId } = data;
    if (games[gameCode] && players[playerId]) {
      socket.join(gameCode);
      players[playerId].socketId = socket.id;

      io.to(gameCode).emit("player-joined", {
        player: players[playerId],
        totalPlayers: games[gameCode].players.length,
      });

      console.log(`👤 Player joined room: ${players[playerId].name}`);
    }
  });

  // Assign player to team
  socket.on("join-team", (data) => {
    const { gameCode, playerId, teamId } = data;
    if (games[gameCode] && players[playerId]) {
      players[playerId].teamId = teamId;

      io.to(gameCode).emit("team-updated", {
        playerId,
        teamId,
        game: games[gameCode],
      });
    }
  });

  // Start game
  socket.on("start-game", (data) => {
    const { gameCode } = data;
    const game = games[gameCode];

    if (game && game.hostId === socket.id) {
      game.status = "active";
      game.currentQuestionIndex = 0;

      // Reset all answers
      game.questions.forEach((q) => {
        q.answers.forEach((a) => (a.revealed = false));
      });

      io.to(gameCode).emit("game-started", {
        game,
        currentQuestion: getCurrentQuestion(game),
      });

      console.log(`🚀 Game started: ${gameCode}`);
    }
  });

  // Clear buzzer (host only)
  socket.on("clear-buzzer", (data) => {
    const { gameCode } = data;
    const game = games[gameCode];

    if (game && game.hostId === socket.id) {
      game.currentBuzzer = null;
      io.to(gameCode).emit("buzzer-cleared", { game });
      console.log(`🔄 Buzzer cleared by host in game: ${gameCode}`);
    }
  });
  // Player buzzes in
socket.on('buzz-in', (data) => {
  const { gameCode, playerId } = data;
  const game = games[gameCode];
  
  if (game && players[playerId] && game.status === 'active') {
    // Check if this is the first buzz for this question
    if (!game.currentBuzzer) {
      const player = players[playerId];
      const teamId = player.teamId;
      
      if (teamId) {
        // Set this player's team as the active team automatically
        game.teams.forEach(team => {
          team.active = (team.id === teamId);
        });
        
        // Track the current buzzer
        game.currentBuzzer = {
          playerId,
          teamId,
          timestamp: Date.now()
        };
        
        // Emit the buzz event to all clients
        io.to(gameCode).emit('player-buzzed', {
          playerId,
          playerName: player.name,
          teamId: player.teamId,
          timestamp: game.currentBuzzer.timestamp,
          game // Send updated game state
        });
        
        console.log(`🔔 First Buzz: ${player.name} (${game.teams.find(t => t.id === teamId)?.name})`);
      }
    } else {
      // Someone else already buzzed in, send a "too late" event just to this player
      socket.emit('buzz-too-late', {
        firstBuzzer: players[game.currentBuzzer.playerId]?.name
      });
    }
  }
});
  // Submit answer
  // Submit answer
socket.on('submit-answer', (data) => {
  const { gameCode, playerId, answer } = data;
  const game = games[gameCode];
  
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
      
      const player = players[playerId];
      const team = game.teams.find(t => t.id === player.teamId);
      
      if (team) {
        // Award points based on the point value * round multiplier
        const pointValue = matchingAnswer.points * game.currentRound;
        team.score += pointValue;
        
        io.to(gameCode).emit('answer-revealed', {
          answer: matchingAnswer,
          playerName: player.name,
          teamName: team.name,
          pointsAwarded: pointValue,
          game
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
              
              io.to(gameCode).emit('next-question', {
                game,
                currentQuestion: nextQuestion
              });
              
              console.log(`➡️ Auto advancing to next question: ${game.currentQuestionIndex + 1}`);
            } else {
              // End game if no more questions
              game.status = 'finished';
              const winner = game.teams.reduce((prev, current) => 
                prev.score > current.score ? prev : current
              );
              
              io.to(gameCode).emit('game-over', { game, winner });
              console.log(`🏆 Game finished: ${gameCode}, Winner: ${winner.name}`);
            }
          } else {
            // Reset buzzer for next answer on same question
            game.currentBuzzer = null;
            io.to(gameCode).emit('buzzer-cleared', { game });
          }
        }, 2500);
      }
    } else {
      // Wrong answer
      const player = players[playerId];
      const team = game.teams.find(t => t.id === player.teamId);
      
      if (team) {
        // Add strike automatically
        team.strikes += 1;
        
        io.to(gameCode).emit('wrong-answer', {
          answer,
          playerName: player.name,
          teamName: team.name,
          strikes: team.strikes,
          game
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
          
          io.to(gameCode).emit('team-switched', { game });
          console.log(`↔️ Team switched after 3 strikes`);
        }
        
        // Reset buzzer
        setTimeout(() => {
          io.to(gameCode).emit('buzzer-cleared', { game });
        }, 1500);
      }
    }
  }
});
  // Host reveals answer manually
  socket.on("reveal-answer", (data) => {
    const { gameCode, answerIndex } = data;
    const game = games[gameCode];

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

        io.to(gameCode).emit("answer-revealed", {
          answer,
          playerName: "Host",
          game,
        });
      }
    }
  });

  // Add strike manually
  socket.on("add-strike", (data) => {
    const { gameCode, teamId } = data;
    const game = games[gameCode];

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

        io.to(gameCode).emit("strike-added", { game });
      }
    }
  });

  // Award points manually
  socket.on("award-points", (data) => {
    const { gameCode, teamId, points } = data;
    const game = games[gameCode];

    if (game && game.hostId === socket.id) {
      const team = game.teams.find((t) => t.id === teamId);
      if (team) {
        team.score += points;
        io.to(gameCode).emit("points-awarded", { game });
      }
    }
  });

  // Switch teams
  socket.on("switch-teams", (data) => {
    const { gameCode } = data;
    const game = games[gameCode];

    if (game && game.hostId === socket.id) {
      game.teams.forEach((team) => {
        team.active = !team.active;
        team.strikes = 0;
      });

      io.to(gameCode).emit("team-switched", { game });
    }
  });

  // Next question
  socket.on("next-question", (data) => {
    const { gameCode } = data;
    const game = games[gameCode];

    if (game && game.hostId === socket.id) {
      game.currentQuestionIndex += 1;

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

        io.to(gameCode).emit("game-over", { game, winner });
        console.log(`🏆 Game finished: ${gameCode}, Winner: ${winner.name}`);
      } else {
        game.teams.forEach((team) => (team.strikes = 0));
        game.teams[0].active = true;
        game.teams[1].active = false;

        io.to(gameCode).emit("next-question", {
          game,
          currentQuestion: getCurrentQuestion(game),
        });

        console.log(`➡️ Next question: ${game.currentQuestionIndex + 1}`);
      }
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);

    Object.values(players).forEach((player) => {
      if (player.socketId === socket.id) {
        player.connected = false;
      }
    });

    Object.values(games).forEach((game) => {
      if (game.hostId === socket.id) {
        game.hostId = null;
        console.log(`👑 Host disconnected from game: ${game.code}`);
      }
    });
  });
});

// Cleanup old games periodically
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  Object.keys(games).forEach((gameCode) => {
    if (games[gameCode].createdAt < oneHourAgo) {
      delete games[gameCode];
      console.log(`🧹 Cleaned up old game: ${gameCode}`);
    }
  });
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Sanskrit Shabd Samvad Server running on port ${PORT}`);
  console.log(`📱 Frontend should connect to http://localhost:${PORT}`);
  console.log(`🎮 Ready for multiplayer games!`);
});
