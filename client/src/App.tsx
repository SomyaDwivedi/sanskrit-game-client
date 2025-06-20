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

// Header Component
const Header: React.FC<{ gameCode?: string; timer?: string }> = ({ gameCode, timer }) => {
  return (
    <header className="card p-4 mb-4">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          संस्कृत विद्या Challenge
        </div>
        {gameCode && (
          <div className="text-center">
            <div className="text-sm text-slate-400">Game Code</div>
            <div className="text-lg font-mono font-bold">{gameCode}</div>
          </div>
        )}
        <div className="timer">{timer || '00:00'}</div>
      </div>
    </header>
  );
};

// Home Page Component
const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header />
        
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent sanskrit-text">
            संस्कृत विद्या Challenge
          </h1>
          <p className="text-xl text-slate-400 mb-12">
            Professional Sanskrit Knowledge Competition Platform
          </p>
          
          <div className="space-y-6 max-w-md mx-auto">
            <Link 
              to="/host" 
              className="btn btn-primary block text-center py-4 text-lg w-full"
              style={{ textDecoration: 'none' }}
            >
              🎮 HOST GAME
            </Link>
            <Link 
              to="/join" 
              className="btn btn-success block text-center py-4 text-lg w-full"
              style={{ textDecoration: 'none' }}
            >
              🎯 JOIN GAME
            </Link>
          </div>
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
  const [timer, setTimer] = useState('00:00');
  const [gameTimer, setGameTimer] = useState(0);
  const [team1Name, setTeam1Name] = useState('Team Alpha');
  const [team2Name, setTeam2Name] = useState('Team Beta');

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (game?.status === 'active') {
      interval = setInterval(() => {
        setGameTimer(prev => {
          const newTime = prev + 1;
          const minutes = Math.floor(newTime / 60);
          const seconds = newTime % 60;
          setTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [game?.status]);

  const createGame = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/create-game');
      const { gameCode } = response.data;
      setGameCode(gameCode);
      
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);
      
      newSocket.emit('host-join', { gameCode });
      
      newSocket.on('host-joined', (gameData: Game) => {
        // Update team names
        gameData.teams[0].name = team1Name;
        gameData.teams[1].name = team2Name;
        setGame(gameData);
      });

      newSocket.on('player-joined', (data) => {
        console.log('Player joined:', data.player.name);
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

  const markCorrect = () => {
    // Add logic for marking answers as correct
    console.log('Mark correct');
  };

  const switchTeam = () => {
    if (game) {
      // Switch active team
      const updatedTeams = game.teams.map(team => ({
        ...team,
        active: !team.active
      }));
      setGame({...game, teams: updatedTeams});
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
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Header />
          
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Team Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full team1-color flex items-center justify-center text-white font-bold text-xl">1</div>
                  <h3 className="text-lg font-semibold">Team Alpha</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Team Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={team1Name}
                      onChange={(e) => setTeam1Name(e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Team Members</label>
                    <input type="text" className="input-field mb-2" placeholder="Member 1 (Captain)" />
                    <input type="text" className="input-field mb-2" placeholder="Member 2" />
                    <input type="text" className="input-field mb-2" placeholder="Member 3" />
                    <input type="text" className="input-field mb-2" placeholder="Member 4" />
                    <input type="text" className="input-field" placeholder="Member 5 (Optional)" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full team2-color flex items-center justify-center text-white font-bold text-xl">2</div>
                  <h3 className="text-lg font-semibold">Team Beta</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Team Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={team2Name}
                      onChange={(e) => setTeam2Name(e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Team Members</label>
                    <input type="text" className="input-field mb-2" placeholder="Member 1 (Captain)" />
                    <input type="text" className="input-field mb-2" placeholder="Member 2" />
                    <input type="text" className="input-field mb-2" placeholder="Member 3" />
                    <input type="text" className="input-field mb-2" placeholder="Member 4" />
                    <input type="text" className="input-field" placeholder="Member 5 (Optional)" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={createGame}
                disabled={isLoading}
                className="btn btn-primary py-3 px-8 text-lg"
              >
                {isLoading ? 'CREATING...' : 'START COMPETITION'}
              </button>
              
              <div className="mt-4">
                <Link to="/" className="text-slate-400 hover:text-white">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = game?.questions[game.currentQuestionIndex];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl h-screen flex flex-col">
        <Header gameCode={gameCode} timer={timer} />

        {/* Waiting Screen */}
        {game?.status === 'waiting' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="card p-8 max-w-md mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Waiting for Players</h2>
              <p className="text-slate-400 mb-6">
                Share the game code: <span className="text-white font-mono text-xl">{gameCode}</span>
              </p>
              
              {game.players.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Connected Players:</h3>
                  <div className="space-y-2">
                    {game.players.map(player => (
                      <div key={player.id} className="card p-2">
                        <span className="text-white">{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={startGame}
                disabled={game.players.length === 0}
                className="btn btn-success py-3 px-8"
              >
                🚀 START COMPETITION
              </button>
            </div>
          </div>
        )}

        {/* Active Game Screen */}
        {game?.status === 'active' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team 1 Panel */}
            <div className={`card p-6 ${game.teams[0]?.active ? 'team-active' : ''} lg:order-1`}>
              <div className="text-center mb-6">
                <div className="text-lg font-semibold mb-2">{game.teams[0]?.name}</div>
                <div className="text-4xl font-bold text-red-400 mb-4">
                  {game.teams[0]?.score}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">Team Members</div>
                <div className="space-y-1">
                  <div className="text-sm bg-slate-700/50 p-2 rounded">Dr. Arjun Sharma 👑</div>
                  <div className="text-sm bg-slate-700/50 p-2 rounded">Prof. Priya Gupta</div>
                  <div className="text-sm bg-slate-700/50 p-2 rounded">Rajesh Kumar</div>
                  <div className="text-sm bg-slate-700/50 p-2 rounded">Sneha Patel</div>
                </div>
              </div>
              
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3].map((strike) => (
                  <div
                    key={strike}
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center font-bold text-sm ${
                      strike <= (game.teams[0]?.strikes || 0)
                        ? 'bg-red-500 border-red-500 text-white strike-appear'
                        : 'border-slate-600'
                    }`}
                  >
                    {strike <= (game.teams[0]?.strikes || 0) ? '✗' : ''}
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => addStrike(game.teams[0]?.id)}
                disabled={(game.teams[0]?.strikes || 0) >= 3}
                className="btn btn-secondary w-full"
              >
                ADD STRIKE
              </button>
            </div>

            {/* Game Center */}
            <div className="lg:order-2">
              {currentQuestion && (
                <div className="space-y-6">
                  <div className="card p-4 text-center bg-gradient-to-r from-purple-600 to-blue-600">
                    <div className="font-semibold">
                      Round {game.currentRound}: Foundation Knowledge • {game.currentRound}x Multiplier
                    </div>
                  </div>

                  <div className="card p-8 relative">
                    <span className="absolute top-4 left-4 bg-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                      Q{game.currentQuestionIndex + 1}
                    </span>
                    <div className="text-center">
                      <div className="text-sm text-purple-300 mb-2">{currentQuestion.category}</div>
                      <h2 className="text-xl font-semibold">{currentQuestion.question}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {currentQuestion.answers.map((answer, index) => (
                      <div
                        key={index}
                        className={`card p-4 cursor-pointer transition-all ${
                          answer.revealed
                            ? 'bg-blue-600 answer-reveal'
                            : 'hover:border-blue-500'
                        }`}
                        onClick={() => !answer.revealed && revealAnswer(index)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">
                            {answer.revealed ? `${index + 1}. ${answer.text}` : `${index + 1}. ____________`}
                          </span>
                          <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                            {answer.revealed ? answer.points : '?'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4 mb-6">
                    {[1, 2, 3].map((strike) => (
                      <div
                        key={strike}
                        className="w-12 h-12 bg-slate-700 border-2 border-slate-600 rounded flex items-center justify-center text-xl font-bold"
                      >
                        ✗
                      </div>
                    ))}
                  </div>

                  <div className="card p-4">
                    <div className="grid grid-cols-4 gap-3">
                      <button onClick={markCorrect} className="btn btn-success">✓ CORRECT</button>
                      <button className="btn btn-secondary">✗ STRIKE</button>
                      <button onClick={switchTeam} className="btn btn-accent">↔ SWITCH</button>
                      <button onClick={nextQuestion} className="btn btn-primary">NEXT →</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Team 2 Panel */}
            <div className={`card p-6 ${game.teams[1]?.active ? 'team-active' : ''} lg:order-3`}>
              <div className="text-center mb-6">
                <div className="text-lg font-semibold mb-2">{game.teams[1]?.name}</div>
                <div className="text-4xl font-bold text-blue-400 mb-4">
                  {game.teams[1]?.score}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">Team Members</div>
                <div className="space-y-1">
                  <div className="text-sm bg-slate-700/50 p-2 rounded">Dr. Maya Joshi</div>
                  <div className="text-sm bg-slate-700/50 p-2 rounded">Kiran Reddy</div>
                  <div className="text-sm bg-slate-700/50 p-2 rounded">Prof. Suresh Nair</div>
                  <div className="text-sm bg-slate-700/50 p-2 rounded">Kavita Rao</div>
                </div>
              </div>
              
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3].map((strike) => (
                  <div
                    key={strike}
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center font-bold text-sm ${
                      strike <= (game.teams[1]?.strikes || 0)
                        ? 'bg-red-500 border-red-500 text-white strike-appear'
                        : 'border-slate-600'
                    }`}
                  >
                    {strike <= (game.teams[1]?.strikes || 0) ? '✗' : ''}
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => addStrike(game.teams[1]?.id)}
                disabled={(game.teams[1]?.strikes || 0) >= 3}
                className="btn btn-secondary w-full"
              >
                ADD STRIKE
              </button>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {game?.status === 'finished' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="card p-8 max-w-2xl mx-auto text-center">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-8 rounded-lg mb-8 relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2">🏆 CHAMPION 🏆</h2>
                  <p className="text-2xl font-semibold">
                    {game?.teams.sort((a, b) => b.score - a.score)[0]?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                {game?.teams.sort((a, b) => b.score - a.score).map((team, index) => (
                  <div key={team.id} className="card p-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">{team.name}</h3>
                    <div className={`text-3xl font-bold mb-2 ${index === 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {team.score}
                    </div>
                    <p className="text-sm text-slate-400">Final Score</p>
                    <p className="text-xs text-slate-400 mt-1">Accuracy: {Math.floor(Math.random() * 20) + 70}%</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{game?.questions.length}</div>
                  <div className="text-sm text-slate-400">Total Questions</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{timer}</div>
                  <div className="text-sm text-slate-400">Game Duration</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {(game?.teams[0]?.strikes || 0) + (game?.teams[1]?.strikes || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Total Strikes</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">50</div>
                  <div className="text-sm text-slate-400">Highest Points</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link to="/" className="btn btn-primary">NEW GAME</Link>
                <button className="btn btn-accent">EXPORT RESULTS</button>
              </div>
            </div>
          </div>
        )}
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
      
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);
      
      newSocket.emit('player-join', { gameCode: gameCode.toUpperCase().trim(), playerId: newPlayerId });
      
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
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Header />
          
          <div className="max-w-md mx-auto mt-16">
            <div className="card p-8">
              <h1 className="text-2xl font-bold text-center mb-6">Join Game</h1>
              
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Game Code</label>
                  <input
                    type="text"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    className="input-field text-center text-lg font-mono"
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
                    className="input-field"
                    placeholder="Enter your name"
                    maxLength={20}
                  />
                </div>
              </div>
              
              <button
                onClick={joinGame}
                disabled={isLoading || !gameCode.trim() || !playerName.trim()}
                className="btn btn-success w-full py-3"
              >
                {isLoading ? 'JOINING...' : '🎯 JOIN GAME'}
              </button>
              
              <Link to="/" className="block mt-4 text-center text-slate-400 hover:text-white">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = game.questions[game.currentQuestionIndex];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header gameCode={game.code} />

        {/* Team Selection */}
        {game.status === 'waiting' && !selectedTeam && (
          <div className="card p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Choose Your Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {game.teams.map((team, index) => (
                <button
                  key={team.id}
                  onClick={() => joinTeam(team.id)}
                  className="card p-6 hover:border-blue-500 transition-all text-center"
                >
                  <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl ${
                    index === 0 ? 'team1-color' : 'team2-color'
                  }`}>
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{team.name}</h3>
                  <p className="text-slate-400">Score: {team.score}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Waiting for Game */}
        {game.status === 'waiting' && selectedTeam && (
          <div className="card p-8 max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Waiting for Game to Start</h2>
            <p className="text-slate-400 mb-4">
              You're on <span className="text-white font-semibold">
                {game.teams.find(t => t.id === selectedTeam)?.name}
              </span>
            </p>
            <div className="text-6xl loading-pulse">⏳</div>
          </div>
        )}

        {/* Active Game */}
        {game.status === 'active' && currentQuestion && (
          <div className="space-y-6">
            {/* Question Display */}
            <div className="card p-8">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                  {currentQuestion.category}
                </span>
                <span className="text-slate-400">
                  Question {game.currentQuestionIndex + 1}/{game.questions.length}
                </span>
              </div>

              <h2 className="text-2xl font-semibold text-center mb-8">{currentQuestion.question}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`card p-4 transition-all ${
                      answer.revealed
                        ? 'bg-green-500/20 border-green-500'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {answer.revealed ? `${index + 1}. ${answer.text}` : `${index + 1}. ???`}
                      </span>
                      <span className="font-bold text-blue-400">
                        {answer.revealed ? answer.points : '?'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buzzer and Answer Input */}
            {selectedTeam && (
              <div className="card p-6">
                {!buzzerPressed ? (
                  <button
                    onClick={buzzIn}
                    className="w-full buzzer-button"
                  >
                    🔔 BUZZ IN!
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-yellow-400 font-semibold text-lg">
                        🔔 You buzzed in! Submit your answer:
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="input-field flex-1"
                        placeholder="Type your answer..."
                        autoFocus
                      />
                      <button
                        onClick={submitAnswer}
                        disabled={!answer.trim()}
                        className="btn btn-success"
                      >
                        SUBMIT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teams Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.teams.map((team, index) => (
                <div key={team.id} className={`card p-6 ${team.active ? 'team-active' : ''}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'team1-color' : 'team2-color'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{team.name}</h3>
                      {team.active && <span className="text-xs text-blue-400">● Active Turn</span>}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-2xl font-bold text-white">{team.score}</p>
                      <p className="text-xs text-slate-400">Points</p>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((strike) => (
                        <div
                          key={strike}
                          className={`w-6 h-6 rounded border flex items-center justify-center text-xs ${
                            strike <= team.strikes
                              ? 'bg-red-500 border-red-500 text-white'
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
          <div className="card p-8 max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">🏆 Game Over!</h2>
            <div className="space-y-4 mb-6">
              {game.teams
                .sort((a, b) => b.score - a.score)
                .map((team, index) => (
                  <div key={team.id} className={`card p-4 ${index === 0 ? 'bg-yellow-500/20 border-yellow-500/50' : ''}`}>
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
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-green-400 font-semibold">🎉 Congratulations! Your team won!</p>
              </div>
            )}
            
            <Link to="/" className="btn btn-primary">
              🏠 JOIN ANOTHER GAME
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