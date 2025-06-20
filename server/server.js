const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const mockQuestions = require('./mockData');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// In-memory game storage (no database needed)
let games = {};
let players = {};

// Generate random game code
function generateGameCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Utility function to get current question
function getCurrentQuestion(game) {
  if (game.currentQuestionIndex < game.questions.length) {
    return game.questions[game.currentQuestionIndex];
  }
  return null;
}

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sanskrit Shabd Sambvad Game Server',
    status: 'Running',
    activeGames: Object.keys(games).length,
    connectedPlayers: Object.keys(players).length
  });
});

app.post('/api/create-game', (req, res) => {
  const gameCode = generateGameCode();
  const gameId = uuidv4();
  
  games[gameCode] = {
    id: gameId,
    code: gameCode,
    status: 'waiting',
    currentQuestionIndex: 0,
    currentRound: 1,
    questions: JSON.parse(JSON.stringify(mockQuestions)), // Deep copy
    teams: [
      { id: uuidv4(), name: 'Team Alpha', score: 0, strikes: 0, active: true },
      { id: uuidv4(), name: 'Team Beta', score: 0, strikes: 0, active: false }
    ],
    players: [],
    hostId: null,
    createdAt: new Date()
  };
  
  console.log(`🎮 Game created: ${gameCode}`);
  res.json({ gameCode, gameId });
});

app.post('/api/join-game', (req, res) => {
  const { gameCode, playerName } = req.body;
  
  if (!games[gameCode]) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  const playerId = uuidv4();
  const player = {
    id: playerId,
    name: playerName,
    gameCode,
    connected: true,
    teamId: null
  };
  
  players[playerId] = player;
  games[gameCode].players.push(player);
  
  console.log(`👤 Player joined: ${playerName} in game ${gameCode}`);
  res.json({ playerId, game: games[gameCode] });
});

app.get('/api/game/:code', (req, res) => {
  const game = games[req.params.code];
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game);
});

// Socket.IO for real-time multiplayer
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  // Host joins game
  socket.on('host-join', (data) => {
    const { gameCode } = data;
    if (games[gameCode]) {
      games[gameCode].hostId = socket.id;
      socket.join(gameCode);
      socket.emit('host-joined', games[gameCode]);
      console.log(`👑 Host joined game: ${gameCode}`);
    }
  });

  // Player joins game room
  socket.on('player-join', (data) => {
    const { gameCode, playerId } = data;
    if (games[gameCode] && players[playerId]) {
      socket.join(gameCode);
      players[playerId].socketId = socket.id;
      
      // Notify all players in the game
      io.to(gameCode).emit('player-joined', {
        player: players[playerId],
        totalPlayers: games[gameCode].players.length
      });
      
      console.log(`👤 Player joined room: ${players[playerId].name}`);
    }
  });

  // Assign player to team
  socket.on('join-team', (data) => {
    const { gameCode, playerId, teamId } = data;
    if (games[gameCode] && players[playerId]) {
      players[playerId].teamId = teamId;
      
      io.to(gameCode).emit('team-updated', {
        playerId,
        teamId,
        game: games[gameCode]
      });
    }
  });

  // Start game
  socket.on('start-game', (data) => {
    const { gameCode } = data;
    const game = games[gameCode];
    
    if (game && game.hostId === socket.id) {
      game.status = 'active';
      game.currentQuestionIndex = 0;
      
      // Reset all answers
      game.questions.forEach(q => {
        q.answers.forEach(a => a.revealed = false);
      });
      
      io.to(gameCode).emit('game-started', {
        game,
        currentQuestion: getCurrentQuestion(game)
      });
      
      console.log(`🚀 Game started: ${gameCode}`);
    }
  });

  // Player buzzes in
  socket.on('buzz-in', (data) => {
    const { gameCode, playerId } = data;
    if (games[gameCode] && players[playerId]) {
      io.to(gameCode).emit('player-buzzed', {
        playerId,
        playerName: players[playerId].name,
        teamId: players[playerId].teamId,
        timestamp: Date.now()
      });
      
      console.log(`🔔 Buzz: ${players[playerId].name}`);
    }
  });

  // Submit answer
  socket.on('submit-answer', (data) => {
    const { gameCode, playerId, answer } = data;
    const game = games[gameCode];
    
    if (game && game.status === 'active') {
      const currentQuestion = getCurrentQuestion(game);
      if (!currentQuestion) return;
      
      // Find matching answer (case insensitive, partial match)
      const matchingAnswer = currentQuestion.answers.find(a => 
        !a.revealed && (
          a.text.toLowerCase().includes(answer.toLowerCase().trim()) ||
          answer.toLowerCase().trim().includes(a.text.toLowerCase())
        )
      );
      
      if (matchingAnswer) {
        // Correct answer!
        matchingAnswer.revealed = true;
        
        // Add points to player's team
        const player = players[playerId];
        if (player && player.teamId) {
          const team = game.teams.find(t => t.id === player.teamId);
          if (team) {
            team.score += matchingAnswer.points;
          }
        }
        
        io.to(gameCode).emit('answer-revealed', {
          answer: matchingAnswer,
          playerName: players[playerId].name,
          game
        });
        
        console.log(`✅ Correct: ${answer} by ${players[playerId].name}`);
      } else {
        // Wrong answer - add strike to active team
        const activeTeam = game.teams.find(t => t.active);
        if (activeTeam) {
          activeTeam.strikes += 1;
          
          if (activeTeam.strikes >= 3) {
            // Switch teams
            game.teams.forEach(team => {
              team.active = !team.active;
              team.strikes = 0; // Reset strikes for new team
            });
          }
        }
        
        io.to(gameCode).emit('wrong-answer', {
          answer,
          playerName: players[playerId].name,
          game
        });
        
        console.log(`❌ Wrong: ${answer} by ${players[playerId].name}`);
      }
    }
  });

  // Host reveals answer manually
  socket.on('reveal-answer', (data) => {
    const { gameCode, answerIndex } = data;
    const game = games[gameCode];
    
    if (game && game.hostId === socket.id) {
      const currentQuestion = getCurrentQuestion(game);
      if (currentQuestion && currentQuestion.answers[answerIndex]) {
        currentQuestion.answers[answerIndex].revealed = true;
        
        io.to(gameCode).emit('answer-revealed', {
          answer: currentQuestion.answers[answerIndex],
          playerName: 'Host',
          game
        });
      }
    }
  });

  // Add strike manually
  socket.on('add-strike', (data) => {
    const { gameCode, teamId } = data;
    const game = games[gameCode];
    
    if (game && game.hostId === socket.id) {
      const team = game.teams.find(t => t.id === teamId);
      if (team) {
        team.strikes += 1;
        
        if (team.strikes >= 3) {
          // Switch teams
          game.teams.forEach(t => {
            t.active = !t.active;
            t.strikes = 0;
          });
        }
        
        io.to(gameCode).emit('strike-added', { game });
      }
    }
  });

  // Next question
  socket.on('next-question', (data) => {
    const { gameCode } = data;
    const game = games[gameCode];
    
    if (game && game.hostId === socket.id) {
      game.currentQuestionIndex += 1;
      
      if (game.currentQuestionIndex >= game.questions.length) {
        // Game over
        game.status = 'finished';
        const winner = game.teams.reduce((prev, current) => 
          prev.score > current.score ? prev : current
        );
        
        io.to(gameCode).emit('game-over', { game, winner });
        console.log(`🏆 Game finished: ${gameCode}, Winner: ${winner.name}`);
      } else {
        // Reset for new question
        game.teams.forEach(team => team.strikes = 0);
        game.teams[0].active = true;
        game.teams[1].active = false;
        
        io.to(gameCode).emit('next-question', {
          game,
          currentQuestion: getCurrentQuestion(game)
        });
        
        console.log(`➡️ Next question: ${game.currentQuestionIndex + 1}`);
      }
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
    
    // Find and update player status
    Object.values(players).forEach(player => {
      if (player.socketId === socket.id) {
        player.connected = false;
      }
    });
    
    // Check if disconnected user was a host
    Object.values(games).forEach(game => {
      if (game.hostId === socket.id) {
        game.hostId = null;
        console.log(`👑 Host disconnected from game: ${game.code}`);
      }
    });
  });
});

// Cleanup old games periodically (every hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  Object.keys(games).forEach(gameCode => {
    if (games[gameCode].createdAt < oneHourAgo) {
      delete games[gameCode];
      console.log(`🧹 Cleaned up old game: ${gameCode}`);
    }
  });
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Sanskrit Game Server running on port ${PORT}`);
  console.log(`📱 Frontend should connect to http://localhost:${PORT}`);
  console.log(`🎮 Ready for multiplayer games!`);
});