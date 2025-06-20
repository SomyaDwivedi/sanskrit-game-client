import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import './index.css';

// Types
interface Game {
  id: string;
  code: string;
  status: 'waiting' | 'active' | 'finished';
  currentQuestionIndex: number;
  currentRound: number;
  questions: Question[];
  teams: Team[];
  players: Player[];
}

interface Question {
  id: number;
  round: number;
  category: string;
  question: string;
  answers: Answer[];
}

interface Answer {
  text: string;
  points: number;
  revealed: boolean;
}

interface Team {
  id: string;
  name: string;
  score: number;
  strikes: number;
  active: boolean;
}

interface Player {
  id: string;
  name: string;
  gameCode: string;
  connected: boolean;
  teamId?: string;
}

// Home Page Component
const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center max-w-md w-full">
        <div className="mb-6">
          <span className="text-4xl mb-4 block">🕉️</span>
          <h1 className="text-3xl font-bold text-white mb-2 sanskrit-text">
            संस्कृत शब्द संभवाद
          </h1>
          <h2 className="text-xl font-semibold text-blue-300 mb-2">
            Sanskrit Shabd Sambvad
          </h2>
          <p className="text-slate-400">
            The Ultimate Sanskrit Knowledge Game
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            to="/host" 
            className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 font-semibold btn-hover"
          >
            🎮 Host Game
          </Link>
          <Link 
            to="/join" 
            className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 font-semibold btn-hover"
          >
            🎯 Join Game
          </Link>
        </div>
        
        <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm font-medium">
            ✅ Standalone multiplayer game ready!
          </p>
        </div>
      </div>
    </div>
  );
};

// Host Page Component
const HostPage: React.FC = () => {
  const [gameCode, setGameCode] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createGame = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/create-game');
      const { gameCode } = response.data;
      setGameCode(gameCode);
      
      // Connect to socket and join as host
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);
      
      newSocket.emit('host-join', { gameCode });
      
      newSocket.on('host-joined', (gameData: Game) => {
        setGame(gameData);
      });

      newSocket.on('player-joined', (data) => {
        console.log('Player joined:', data.player.name);
        // Update game state with new player
        setGame(prev => prev ? {...prev, players: [...prev.players, data.player]} : null);
      });

    } catch (error) {
      console.error('Error creating game:', error);
    }
    setIsLoading(false);
  };

  const startGame = () => {
    if (socket && gameCode) {
      socket.emit('start-game', { gameCode });
    }
  };

  const nextQuestion = () => {
    if (socket && gameCode) {
      socket.emit('next-question', { gameCode });
    }
  };

  const revealAnswer = (answerIndex: number) => {
    if (socket && gameCode) {
      socket.emit('reveal-answer', { gameCode, answerIndex });
    }
  };

  const addStrike = (teamId: string) => {
    if (socket && gameCode) {
      socket.emit('add-strike', { gameCode, teamId });
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('game-started', (data) => {
        setGame(data.game);
      });

      socket.on('answer-revealed', (data) => {
        setGame(data.game);
      });

      socket.on('wrong-answer', (data) => {
        setGame(data.game);
      });

      socket.on('next-question', (data) => {
        setGame(data.game);
      });

      socket.on('game-over', (data) => {
        setGame(data.game);
      });

      socket.on('strike-added', (data) => {
        setGame(data.game);
      });

      return () => {
        socket.off('game-started');
        socket.off('answer-revealed');
        socket.off('wrong-answer');
        socket.off('next-question');
        socket.off('game-over');
        socket.off('strike-added');
      };
    }
  }, [socket]);

  if (!gameCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6">Host a Game</h1>
          
          <button
            onClick={createGame}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 font-semibold btn-hover disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : '🎮 Create New Game'}
          </button>
          
          <Link to="/" className="block mt-4 text-slate-400 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = game?.questions[game.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Host Dashboard</h1>
              <p className="text-slate-400">Game Code: <span className="text-white font-mono text-xl">{gameCode}</span></p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Players: {game?.players.length || 0}</p>
              <p className="text-slate-400">Status: <span className={`${game?.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>{game?.status}</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams */}
          <div className="space-y-4">
            {game?.teams.map((team, index) => (
              <div key={team.id} className={`bg-slate-800/40 backdrop-blur-lg border rounded-2xl p-6 ${team.active ? 'team-active' : 'border-slate-700/50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-red-500' : 'bg-blue-500'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    {team.active && <span className="text-xs text-blue-400">● Active</span>}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-white">{team.score}</p>
                    <p className="text-xs text-slate-400">Points</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-400">{team.strikes}/3</p>
                    <p className="text-xs text-slate-400">Strikes</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  {[1, 2, 3].map((strike) => (
                    <div
                      key={strike}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                        strike <= team.strikes
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'border-slate-600 text-slate-600'
                      }`}
                    >
                      ✗
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addStrike(team.id)}
                  disabled={team.strikes >= 3}
                  className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-all font-semibold disabled:opacity-50"
                >
                  Add Strike
                </button>
              </div>
            ))}
          </div>

          {/* Current Question */}
          <div className="lg:col-span-2">
            {game?.status === 'waiting' && (
              <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center">
                <h2 className="text-xl font-semibold text-white mb-4">Waiting for Players</h2>
                <p className="text-slate-400 mb-6">Share the game code: <span className="text-white font-mono text-lg">{gameCode}</span></p>
                
                {game.players.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Connected Players:</h3>
                    <div className="space-y-2">
                      {game.players.map(player => (
                        <div key={player.id} className="bg-slate-700/50 rounded-lg p-2">
                          <span className="text-white">{player.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={startGame}
                  disabled={game.players.length === 0}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg transition-all font-semibold disabled:opacity-50"
                >
                  🚀 Start Game
                </button>
              </div>
            )}

            {game?.status === 'active' && currentQuestion && (
              <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                    {currentQuestion.category}
                  </span>
                  <span className="text-slate-400">
                    Question {game.currentQuestionIndex + 1}/{game.questions.length}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-white mb-6">{currentQuestion.question}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {currentQuestion.answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        answer.revealed
                          ? 'border-green-500 bg-green-500/20 answer-reveal'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      }`}
                      onClick={() => !answer.revealed && revealAnswer(index)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">
                          {answer.revealed ? `${index + 1}. ${answer.text}` : `${index + 1}. ???`}
                        </span>
                        <span className="text-lg font-bold text-blue-400">
                          {answer.revealed ? answer.points : '?'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={nextQuestion}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition-all font-semibold"
                  >
                    ➡️ Next Question
                  </button>
                </div>
              </div>
            )}

            {game?.status === 'finished' && (
              <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">🏆 Game Over!</h2>
                <div className="space-y-4">
                  {game.teams
                    .sort((a, b) => b.score - a.score)
                    .map((team, index) => (
                      <div key={team.id} className={`p-4 rounded-lg ${index === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-slate-700/30'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold">
                            {index === 0 ? '👑 ' : `${index + 1}. `}{team.name}
                          </span>
                          <span className="text-2xl font-bold text-white">{team.score}</span>
                        </div>
                      </div>
                    ))}
                </div>
                <Link to="/" className="inline-block mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition-all font-semibold">
                  🏠 New Game
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Join Game Page Component
const JoinPage: React.FC = () => {
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [buzzerPressed, setBuzzerPressed] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const joinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/join-game', {
        gameCode: gameCode.toUpperCase().trim(),
        playerName: playerName.trim()
      });
      
      const { playerId: newPlayerId, game: gameData } = response.data;
      setPlayerId(newPlayerId);
      setGame(gameData);
      
      // Connect to socket
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);
      
      newSocket.emit('player-join', { gameCode: gameCode.toUpperCase().trim(), playerId: newPlayerId });
      
      // Socket event listeners
      newSocket.on('game-started', (data) => {
        setGame(data.game);
      });

      newSocket.on('player-buzzed', (data) => {
        if (data.playerId === newPlayerId) {
          setBuzzerPressed(true);
        }
      });

      newSocket.on('answer-revealed', (data) => {
        setGame(data.game);
        setBuzzerPressed(false);
        setAnswer('');
      });

      newSocket.on('wrong-answer', (data) => {
        setGame(data.game);
        setBuzzerPressed(false);
        setAnswer('');
      });

      newSocket.on('next-question', (data) => {
        setGame(data.game);
        setBuzzerPressed(false);
        setAnswer('');
      });

      newSocket.on('game-over', (data) => {
        setGame(data.game);
      });

      newSocket.on('strike-added', (data) => {
        setGame(data.game);
      });

    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to join game');
    }
    
    setIsLoading(false);
  };

  const joinTeam = (teamId: string) => {
    setSelectedTeam(teamId);
    if (socket && gameCode && playerId) {
      socket.emit('join-team', { gameCode, playerId, teamId });
    }
  };

  const buzzIn = () => {
    if (socket && gameCode && playerId && selectedTeam && !buzzerPressed) {
      socket.emit('buzz-in', { gameCode, playerId });
      setBuzzerPressed(true);
    }
  };

  const submitAnswer = () => {
    if (socket && gameCode && playerId && answer.trim() && buzzerPressed) {
      socket.emit('submit-answer', { gameCode, playerId, answer: answer.trim() });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!game) {
        joinGame();
      } else if (buzzerPressed && answer.trim()) {
        submitAnswer();
      }
    }
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Join Game</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Game Code</label>
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono"
                placeholder="Enter game code"
                maxLength={6}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>
            
            <button
              onClick={joinGame}
              disabled={isLoading || !gameCode.trim() || !playerName.trim()}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-6 py-3 rounded-lg transition-all font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : '🎯 Join Game'}
            </button>
          </div>
          
          <Link to="/" className="block mt-4 text-center text-slate-400 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = game.questions[game.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">Player: {playerName}</h1>
              <p className="text-slate-400">Game: {gameCode}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Status: <span className={`${game.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>{game.status}</span></p>
              {selectedTeam && (
                <p className="text-slate-400">Team: <span className="text-white">{game.teams.find(t => t.id === selectedTeam)?.name}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Team Selection */}
        {game.status === 'waiting' && !selectedTeam && (
          <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Choose Your Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.teams.map((team, index) => (
                <button
                  key={team.id}
                  onClick={() => joinTeam(team.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-blue-500 border-slate-600 bg-slate-700/30`}
                >
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                  <p className="text-slate-400">Score: {team.score}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Waiting for Game */}
        {game.status === 'waiting' && selectedTeam && (
          <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Waiting for Game to Start</h2>
            <p className="text-slate-400">You're on <span className="text-white font-semibold">{game.teams.find(t => t.id === selectedTeam)?.name}</span></p>
            <div className="mt-4 flex justify-center">
              <div className="loading-pulse">⏳</div>
            </div>
          </div>
        )}

        {/* Active Game */}
        {game.status === 'active' && currentQuestion && (
          <div className="space-y-6">
            {/* Current Question */}
            <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                  {currentQuestion.category}
                </span>
                <span className="text-slate-400">
                  Question {game.currentQuestionIndex + 1}/{game.questions.length}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-white mb-6">{currentQuestion.question}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion.answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      answer.revealed
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-slate-600 bg-slate-700/30'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">
                        {answer.revealed ? `${index + 1}. ${answer.text}` : `${index + 1}. ???`}
                      </span>
                      <span className="text-lg font-bold text-blue-400">
                        {answer.revealed ? answer.points : '?'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buzzer and Answer Input */}
            {selectedTeam && (
              <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6">
                {!buzzerPressed ? (
                  <button
                    onClick={buzzIn}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-6 rounded-lg transition-all font-bold text-xl buzzer-button"
                  >
                    🔔 BUZZ IN!
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-yellow-400 font-semibold text-lg">🔔 You buzzed in! Quick, submit your answer:</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your answer..."
                        autoFocus
                      />
                      <button
                        onClick={submitAnswer}
                        disabled={!answer.trim()}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg transition-all font-semibold disabled:opacity-50"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teams Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.teams.map((team, index) => (
                <div key={team.id} className={`bg-slate-800/40 backdrop-blur-lg border rounded-2xl p-4 ${team.active ? 'team-active' : 'border-slate-700/50'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-red-500' : 'bg-blue-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{team.name}</h3>
                      {team.active && <span className="text-xs text-blue-400">● Active</span>}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xl font-bold text-white">{team.score}</p>
                      <p className="text-xs text-slate-400">Points</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((strike) => (
                        <div
                          key={strike}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                            strike <= team.strikes
                              ? 'bg-red-500 border-red-500 text-white strike-appear'
                              : 'border-slate-600'
                          }`}
                        >
                          {strike <= team.strikes ? '✗' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Over */}
        {game.status === 'finished' && (
          <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">🏆 Game Over!</h2>
            <div className="space-y-4 mb-6">
              {game.teams
                .sort((a, b) => b.score - a.score)
                .map((team, index) => (
                  <div key={team.id} className={`p-4 rounded-lg ${index === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-slate-700/30'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">
                        {index === 0 ? '👑 ' : `${index + 1}. `}{team.name}
                      </span>
                      <span className="text-2xl font-bold text-white">{team.score}</span>
                    </div>
                  </div>
                ))}
            </div>
            
            {selectedTeam === game.teams.sort((a, b) => b.score - a.score)[0].id && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-green-400 font-semibold">🎉 Congratulations! Your team won!</p>
              </div>
            )}
            
            <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition-all font-semibold">
              🏠 Join Another Game
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/join" element={<JoinPage />} />
      </Routes>
    </Router>
  );
};

export default App;