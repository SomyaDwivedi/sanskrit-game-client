import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import './index.css';
import AudioManager from './AudioManager.ts';
import { Game, Question, Answer, Team, Player } from './types';

// Initialize audio manager
const audioManager = new AudioManager();

// Reusable Components
const Logo: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="text-3xl animate-float">🕉️</div>
    <div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent sanskrit-text">
        संस्कृत शब्द संवाद
      </h1>
      <p className="text-xs text-slate-400">Sanskrit Word Dialogue Game</p>
    </div>
  </div>
);

const Header: React.FC<{ 
  gameCode?: string; 
  timer?: string;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}> = ({ gameCode, timer, soundEnabled = true, onToggleSound }) => {
  return (
    <header className="glass-card p-4 mb-6 sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center">
        <Logo />
        
        {gameCode && (
          <div className="text-center">
            <div className="text-sm text-slate-400">Game Code</div>
            <div className="text-2xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {gameCode}
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          {timer && (
            <div className="timer-display">
              <span className="text-sm text-slate-400">Time</span>
              <span className="text-xl font-bold ml-2">{timer}</span>
            </div>
          )}
          {onToggleSound && (
            <button 
              onClick={onToggleSound}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle sound"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer className="glass-card p-4 mt-8 backdrop-blur-md">
    <div className="container mx-auto text-center">
      <p className="text-sm text-slate-400">
        © 2025 Sanskrit Shabd Samvad • Celebrating Sanskrit Heritage
      </p>
    </div>
  </footer>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="spinner"></div>
  </div>
);

const AnimatedCard: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ 
  children, 
  className = '', 
  delay = 0 
}) => (
  <div 
    className={`animated-card ${className}`} 
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// Home Page Component
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleToggleSound = () => {
    const newState = audioManager.toggleSound();
    setSoundEnabled(newState);
  };

  useEffect(() => {
    audioManager.startBgMusic();
    return () => audioManager.stopBgMusic();
  }, []);

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header soundEnabled={soundEnabled} onToggleSound={handleToggleSound} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <AnimatedCard>
            <div className="text-6xl mb-6 animate-float">🕉️</div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent sanskrit-text animate-gradient">
              संस्कृत शब्द संवाद
            </h1>
            <p className="text-xl text-slate-300 mb-2">Sanskrit Word Dialogue</p>
            <p className="text-lg text-slate-400 mb-12">
              An interactive knowledge competition celebrating Sanskrit heritage
            </p>
          </AnimatedCard>
          
          <div className="flex flex-col md:flex-row gap-6 max-w-2xl mx-auto">
            <AnimatedCard className="flex-1" delay={200}>
              <button 
                onClick={() => navigate('/host')}
                className="btn-primary w-full py-6 text-xl group"
              >
                <span className="text-3xl mr-3 group-hover:animate-bounce">👑</span>
                HOST GAME
                <span className="block text-sm text-blue-200 mt-1">Create & manage a competition</span>
              </button>
            </AnimatedCard>
            
            <AnimatedCard className="flex-1" delay={400}>
              <button 
                onClick={() => navigate('/join')}
                className="btn-success w-full py-6 text-xl group"
              >
                <span className="text-3xl mr-3 group-hover:animate-bounce">🎯</span>
                JOIN GAME
                <span className="block text-sm text-green-200 mt-1">Enter as a contestant</span>
              </button>
            </AnimatedCard>
          </div>

          <AnimatedCard delay={600}>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="glass-card p-6 hover-lift">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="text-lg font-semibold mb-2">Rich Content</h3>
                <p className="text-sm text-slate-400">
                  Questions from classical literature, philosophy, and grammar
                </p>
              </div>
              
              <div className="glass-card p-6 hover-lift">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-lg font-semibold mb-2">Team Play</h3>
                <p className="text-sm text-slate-400">
                  Compete in teams with dynamic scoring and live buzzer system
                </p>
              </div>
              
              <div className="glass-card p-6 hover-lift">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="text-lg font-semibold mb-2">Achievements</h3>
                <p className="text-sm text-slate-400">
                  Track performance with detailed statistics and leaderboards
                </p>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Host Page Component
const HostPage: React.FC = () => {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState('00:00');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Team setup state
  const [teams, setTeams] = useState([
    { name: 'देव संघ', members: ['', '', '', '', ''] },
    { name: 'विद्या मंडल', members: ['', '', '', '', ''] }
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (game?.status === 'active') {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [game?.status]);

  const handleToggleSound = () => {
    const newState = audioManager.toggleSound();
    setSoundEnabled(newState);
  };

  const updateTeamName = (index: number, name: string) => {
    const newTeams = [...teams];
    newTeams[index].name = name;
    setTeams(newTeams);
  };

  const updateTeamMember = (teamIndex: number, memberIndex: number, name: string) => {
    const newTeams = [...teams];
    newTeams[teamIndex].members[memberIndex] = name;
    setTeams(newTeams);
  };

  const createGame = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/create-game');
      const { gameCode } = response.data;
      setGameCode(gameCode);
      
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);
      
      newSocket.emit('host-join', { gameCode, teams });
      
      newSocket.on('host-joined', (gameData: Game) => {
        setGame(gameData);
      });

      newSocket.on('player-joined', (data) => {
        audioManager.playSound('buzz');
        setGame(prev => prev ? {...prev, players: [...prev.players, data.player]} : null);
      });

      setupSocketListeners(newSocket);
    } catch (error) {
      console.error('Error creating game:', error);
    }
    setIsLoading(false);
  };

  const setupSocketListeners = (socket: Socket) => {
    socket.on('game-started', (data) => {
      setGame(data.game);
      audioManager.playSound('correct');
    });

    socket.on('answer-revealed', (data) => {
      setGame(data.game);
      audioManager.playSound('correct');
    });

    socket.on('wrong-answer', (data) => {
      setGame(data.game);
      audioManager.playSound('wrong');
    });

    socket.on('strike-added', (data) => {
      setGame(data.game);
      audioManager.playSound('wrong');
    });

    socket.on('game-over', (data) => {
      setGame(data.game);
      audioManager.playSound('applause');
    });

    socket.on('team-switched', (data) => {
      setGame(data.game);
      audioManager.playSound('buzz');
    });
  };

  const startGame = () => {
    if (socket && gameCode) {
      socket.emit('start-game', { gameCode });
    }
  };

  const revealAnswer = (answerIndex: number) => {
    if (socket && gameCode && game) {
      const answer = game.questions[game.currentQuestionIndex]?.answers[answerIndex];
      if (answer && !answer.revealed) {
        socket.emit('reveal-answer', { gameCode, answerIndex });
      }
    }
  };

  const addStrike = (teamId: string) => {
    if (socket && gameCode) {
      socket.emit('add-strike', { gameCode, teamId });
    }
  };

  const awardPoints = (teamId: string, points: number) => {
    if (socket && gameCode) {
      socket.emit('award-points', { gameCode, teamId, points });
    }
  };

  const switchTeams = () => {
    if (socket && gameCode) {
      socket.emit('switch-teams', { gameCode });
    }
  };

  const nextQuestion = () => {
    if (socket && gameCode) {
      socket.emit('next-question', { gameCode });
    }
  };

  if (!gameCode) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={soundEnabled} onToggleSound={handleToggleSound} />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Configure Teams
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {teams.map((team, teamIndex) => (
                  <div key={teamIndex} className="glass-card p-6 hover-lift">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                        teamIndex === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}>
                        {teamIndex + 1}
                      </div>
                      <input 
                        type="text"
                        value={team.name}
                        onChange={(e) => updateTeamName(teamIndex, e.target.value)}
                        className="input-field text-lg font-semibold flex-1"
                        placeholder="Team Name"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-300">Team Members</label>
                      {team.members.map((member, memberIndex) => (
                        <div key={memberIndex} className="flex items-center gap-3">
                          <span className="text-slate-400 w-8">{memberIndex + 1}.</span>
                          <input
                            type="text"
                            value={member}
                            onChange={(e) => updateTeamMember(teamIndex, memberIndex, e.target.value)}
                            className="input-field flex-1"
                            placeholder={memberIndex === 0 ? "Captain (Required)" : `Member ${memberIndex + 1} (Optional)`}
                          />
                          {memberIndex === 0 && <span className="text-yellow-400">👑</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <button
                  onClick={createGame}
                  disabled={isLoading || !teams[0].members[0] || !teams[1].members[0]}
                  className="btn-primary py-4 px-12 text-xl"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-3">Creating...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mr-3">🚀</span>
                      START COMPETITION
                    </>
                  )}
                </button>
                
                <div className="mt-6">
                  <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </main>
        
        <Footer />
      </div>
    );
  }

  const currentQuestion = game?.questions[game.currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header gameCode={gameCode} timer={timer} soundEnabled={soundEnabled} onToggleSound={handleToggleSound} />
      
      <main className="flex-1 container mx-auto px-4 py-4">
        {/* Waiting Screen */}
        {game?.status === 'waiting' && (
          <AnimatedCard>
            <div className="max-w-2xl mx-auto text-center">
              <div className="glass-card p-8">
                <h2 className="text-3xl font-bold mb-6">Waiting for Players</h2>
                <div className="mb-8">
                  <p className="text-slate-400 mb-4">Share this code with contestants:</p>
                  <div className="text-5xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                    {gameCode}
                  </div>
                </div>
                
                {game.players.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Connected Players ({game.players.length})</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {game.players.map((player, index) => (
                        <AnimatedCard key={player.id} delay={index * 50}>
                          <div className="glass-card p-3 flex items-center gap-3">
                            <span className="text-green-400">●</span>
                            <span>{player.name}</span>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={startGame}
                  disabled={game.players.length < 2}
                  className="btn-success py-4 px-12 text-xl"
                >
                  <span className="text-2xl mr-3">🎮</span>
                  BEGIN COMPETITION
                </button>
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Active Game */}
        {game?.status === 'active' && currentQuestion && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Team 1 Panel */}
            <AnimatedCard className="lg:col-span-1">
              <div className={`glass-card p-6 h-full ${game.teams[0]?.active ? 'ring-2 ring-orange-400 animate-pulse-slow' : ''}`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{game.teams[0]?.name}</h3>
                  <div className="text-5xl font-bold text-orange-400 mb-4 animate-score">
                    {game.teams[0]?.score}
                  </div>
                  <div className="text-sm text-slate-400">Points</div>
                </div>
                
                {game.teams[0]?.members && game.teams[0].members.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">Team Members</h4>
                    <div className="space-y-2">
                      {game.teams[0].members.map((member, idx) => (
                        <div key={idx} className="text-sm glass-card p-2 flex items-center gap-2">
                          {idx === 0 && <span className="text-yellow-400">👑</span>}
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <div className="flex justify-center gap-2 mb-3">
                    {[1, 2, 3].map((strike) => (
                      <div
                        key={strike}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold ${
                          strike <= (game.teams[0]?.strikes || 0)
                            ? 'bg-red-500 border-red-500 text-white animate-strike'
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
                    className="btn-secondary w-full"
                  >
                    ADD STRIKE
                  </button>
                </div>
              </div>
            </AnimatedCard>

            {/* Game Center */}
            <div className="lg:col-span-2">
              <AnimatedCard>
                <div className="glass-card p-4 mb-4 text-center bg-gradient-to-r from-purple-600/20 to-blue-600/20">
                  <h3 className="text-lg font-bold">
                    Round {game.currentRound} • {currentQuestion.category}
                  </h3>
                  <p className="text-sm text-slate-400">Question {game.currentQuestionIndex + 1} of {game.questions.length}</p>
                </div>
              </AnimatedCard>

              <AnimatedCard delay={100}>
                <div className="glass-card p-8 mb-6">
                  <h2 className="text-2xl font-semibold text-center mb-4 sanskrit-text">
                    {currentQuestion.question}
                  </h2>
                  <p className="text-center text-slate-400">Survey Says...</p>
                </div>
              </AnimatedCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentQuestion.answers.map((answer, index) => (
                  <AnimatedCard key={index} delay={200 + index * 50}>
                    <div
                      className={`glass-card p-4 cursor-pointer transition-all hover-lift ${
                        answer.revealed
                          ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400'
                          : 'hover:border-blue-400'
                      }`}
                      onClick={() => !answer.revealed && revealAnswer(index)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">
                          {answer.revealed ? (
                            <span className="animate-reveal">{index + 1}. {answer.text}</span>
                          ) : (
                            `${index + 1}. ${'_'.repeat(12)}`
                          )}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          answer.revealed 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black' 
                            : 'bg-slate-700'
                        }`}>
                          {answer.revealed ? answer.points : '?'}
                        </span>
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>

              {/* Host Answer Reference */}
              <AnimatedCard delay={500}>
                <div className="glass-card p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
                  <h4 className="text-sm font-semibold text-purple-300 mb-3">🔒 Host Reference (Hidden from Players)</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {currentQuestion.answers.map((answer, index) => (
                      <div key={index} className="flex justify-between text-slate-400">
                        <span>{index + 1}. {answer.text}</span>
                        <span className="font-bold text-yellow-400">{answer.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedCard>

              {/* Control Panel */}
              <AnimatedCard delay={600}>
                <div className="glass-card p-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => {
                        const activeTeam = game.teams.find(t => t.active);
                        if (activeTeam) awardPoints(activeTeam.id, 10);
                      }}
                      className="btn-success"
                    >
                      ✓ Award Points
                    </button>
                    <button
                      onClick={() => {
                        const activeTeam = game.teams.find(t => t.active);
                        if (activeTeam) addStrike(activeTeam.id);
                      }}
                      className="btn-secondary"
                    >
                      ✗ Wrong
                    </button>
                    <button
                      onClick={switchTeams}
                      className="btn-accent"
                    >
                      ↔ Switch
                    </button>
                    <button onClick={nextQuestion} className="btn-primary">
                      Next →
                    </button>
                  </div>
                </div>
              </AnimatedCard>
            </div>

            {/* Team 2 Panel */}
            <AnimatedCard className="lg:col-span-1">
              <div className={`glass-card p-6 h-full ${game.teams[1]?.active ? 'ring-2 ring-blue-400 animate-pulse-slow' : ''}`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{game.teams[1]?.name}</h3>
                  <div className="text-5xl font-bold text-blue-400 mb-4 animate-score">
                    {game.teams[1]?.score}
                  </div>
                  <div className="text-sm text-slate-400">Points</div>
                </div>
                
                {game.teams[1]?.members && game.teams[1].members.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">Team Members</h4>
                    <div className="space-y-2">
                      {game.teams[1].members.map((member, idx) => (
                        <div key={idx} className="text-sm glass-card p-2 flex items-center gap-2">
                          {idx === 0 && <span className="text-yellow-400">👑</span>}
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <div className="flex justify-center gap-2 mb-3">
                    {[1, 2, 3].map((strike) => (
                      <div
                        key={strike}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold ${
                          strike <= (game.teams[1]?.strikes || 0)
                            ? 'bg-red-500 border-red-500 text-white animate-strike'
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
                    className="btn-secondary w-full"
                  >
                    ADD STRIKE
                  </button>
                </div>
              </div>
            </AnimatedCard>
          </div>
        )}

        {/* Results Screen */}
        {game?.status === 'finished' && (
          <AnimatedCard>
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-12 text-center">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-8 rounded-2xl mb-8 animate-celebration">
                  <h2 className="text-5xl font-bold mb-4">🏆 CHAMPIONS 🏆</h2>
                  <p className="text-3xl font-bold">
                    {game?.teams.sort((a, b) => b.score - a.score)[0]?.name}
                  </p>
                  <p className="text-xl mt-2">Score: {game?.teams.sort((a, b) => b.score - a.score)[0]?.score}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {game?.teams.sort((a, b) => b.score - a.score).map((team, index) => (
                    <AnimatedCard key={team.id} delay={index * 200}>
                      <div className={`glass-card p-8 ${index === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
                        <div className="text-6xl mb-4">{index === 0 ? '🥇' : '🥈'}</div>
                        <h3 className="text-2xl font-bold mb-4">{team.name}</h3>
                        <div className={`text-4xl font-bold mb-2 ${index === 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                          {team.score} Points
                        </div>
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-slate-400 mb-2">Team Members</h4>
                          <div className="space-y-1">
                            {team.members?.map((member, idx) => (
                              <div key={idx} className="text-sm">
                                {idx === 0 && '👑'} {member}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-blue-400">{game?.questions.length}</div>
                    <div className="text-sm text-slate-400">Total Questions</div>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-green-400">{timer}</div>
                    <div className="text-sm text-slate-400">Game Duration</div>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-red-400">
                      {(game?.teams[0]?.strikes || 0) + (game?.teams[1]?.strikes || 0)}
                    </div>
                    <div className="text-sm text-slate-400">Total Strikes</div>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {Math.max(...game?.questions.flatMap(q => q.answers.map(a => a.points)) || [0])}
                    </div>
                    <div className="text-sm text-slate-400">Highest Points</div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Link to="/" className="btn-primary py-3 px-8">
                    <span className="mr-2">🏠</span> NEW GAME
                  </Link>
                  <button className="btn-accent py-3 px-8" onClick={() => window.print()}>
                    <span className="mr-2">📄</span> EXPORT RESULTS
                  </button>
                </div>
              </div>
            </div>
          </AnimatedCard>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

// Join Page Component
const JoinPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleToggleSound = () => {
    const newState = audioManager.toggleSound();
    setSoundEnabled(newState);
  };

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
      
      setupSocketListeners(newSocket);
      
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to join game');
    }
    
    setIsLoading(false);
  };

  const setupSocketListeners = (socket: Socket) => {
    socket.on('game-started', (data) => {
      setGame(data.game);
      audioManager.playSound('correct');
    });

    socket.on('player-buzzed', (data) => {
      if (data.playerId === playerId) {
        setBuzzerPressed(true);
        audioManager.playSound('buzz');
      }
    });

    socket.on('answer-revealed', (data) => {
      setGame(data.game);
      setBuzzerPressed(false);
      setAnswer('');
    });

    socket.on('wrong-answer', (data) => {
      setGame(data.game);
      setBuzzerPressed(false);
      setAnswer('');
    });

    socket.on('next-question', (data) => {
      setGame(data.game);
      setBuzzerPressed(false);
      setAnswer('');
    });

    socket.on('game-over', (data) => {
      setGame(data.game);
      audioManager.playSound('applause');
    });
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
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={soundEnabled} onToggleSound={handleToggleSound} />
        
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <AnimatedCard>
            <div className="glass-card p-10 max-w-md w-full">
              <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Join Competition
              </h1>
              
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-6 animate-shake">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Game Code</label>
                  <input
                    type="text"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    className="input-field text-center text-2xl font-mono tracking-wider"
                    placeholder="XXXXXX"
                    maxLength={6}
                    autoFocus
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
                className="btn-success w-full py-4 mt-8 text-lg"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-3">JOINING...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl mr-3">🎯</span>
                    JOIN GAME
                  </>
                )}
              </button>
              
              <Link to="/" className="block mt-6 text-center text-slate-400 hover:text-white transition-colors">
                ← Back to Home
              </Link>
            </div>
          </AnimatedCard>
        </main>
        
        <Footer />
      </div>
    );
  }

  const currentQuestion = game.questions[game.currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header gameCode={game.code} soundEnabled={soundEnabled} onToggleSound={handleToggleSound} />

      <main className="flex-1 container mx-auto px-4 py-4">
        {/* Team Selection */}
        {game.status === 'waiting' && !selectedTeam && (
          <AnimatedCard>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Choose Your Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {game.teams.map((team, index) => (
                  <AnimatedCard key={team.id} delay={index * 200}>
                    <button
                      onClick={() => joinTeam(team.id)}
                      className="glass-card p-8 hover-lift text-center transition-all group"
                    >
                      <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-white font-bold text-4xl group-hover:scale-110 transition-transform ${
                        index === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}>
                        {index + 1}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{team.name}</h3>
                      <p className="text-slate-400">Current Score: {team.score}</p>
                    </button>
                  </AnimatedCard>
                ))}
              </div>
            </div>
          </AnimatedCard>
        )}

        {/* Waiting for Game */}
        {game.status === 'waiting' && selectedTeam && (
          <AnimatedCard>
            <div className="glass-card p-12 max-w-md mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Play!</h2>
              <p className="text-lg text-slate-300 mb-6">
                You're on <span className="font-bold text-white">
                  {game.teams.find(t => t.id === selectedTeam)?.name}
                </span>
              </p>
              <div className="text-8xl animate-float mb-6">⏳</div>
              <p className="text-slate-400">Waiting for host to start the game...</p>
            </div>
          </AnimatedCard>
        )}

        {/* Active Game */}
        {game.status === 'active' && currentQuestion && (
          <div className="max-w-4xl mx-auto">
            {/* Question Display */}
            <AnimatedCard>
              <div className="glass-card p-8 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    {currentQuestion.category}
                  </span>
                  <span className="text-slate-400">
                    Q{game.currentQuestionIndex + 1}/{game.questions.length}
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-center mb-8 sanskrit-text">
                  {currentQuestion.question}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`glass-card p-6 transition-all ${
                        answer.revealed
                          ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400'
                          : 'opacity-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-lg">
                          {answer.revealed ? (
                            <span className="animate-reveal">{index + 1}. {answer.text}</span>
                          ) : (
                            `${index + 1}. ???`
                          )}
                        </span>
                        <span className={`font-bold text-xl ${answer.revealed ? 'text-yellow-400' : 'text-slate-600'}`}>
                          {answer.revealed ? answer.points : '?'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedCard>

            {/* Buzzer and Answer Input */}
            {selectedTeam && (
              <AnimatedCard delay={200}>
                <div className="glass-card p-8">
                  {!buzzerPressed ? (
                    <button
                      onClick={buzzIn}
                      className="w-full buzzer-button group"
                    >
                      <span className="text-6xl mb-4 block group-hover:animate-bounce">🔔</span>
                      <span className="text-3xl font-bold">BUZZ IN!</span>
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center">
                        <p className="text-2xl text-yellow-400 font-bold animate-pulse">
                          🔔 You buzzed in!
                        </p>
                      </div>
                      
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="input-field flex-1 text-lg"
                          placeholder="Type your answer..."
                          autoFocus
                        />
                        <button
                          onClick={submitAnswer}
                          disabled={!answer.trim()}
                          className="btn-success px-8"
                        >
                          SUBMIT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            )}

            {/* Teams Display */}
            <AnimatedCard delay={400}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {game.teams.map((team, index) => (
                  <div key={team.id} className={`glass-card p-6 ${team.active ? 'ring-2 ring-yellow-400 animate-pulse-slow' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                          index === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{team.name}</h3>
                          {team.active && <span className="text-xs text-yellow-400">● Active Turn</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{team.score}</p>
                        <p className="text-xs text-slate-400">Points</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3].map((strike) => (
                        <div
                          key={strike}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
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
                ))}
              </div>
            </AnimatedCard>
          </div>
        )}

        {/* Game Over */}
        {game.status === 'finished' && (
          <AnimatedCard>
            <div className="glass-card p-12 max-w-3xl mx-auto text-center">
              <h2 className="text-5xl font-bold text-white mb-8">🏆 Game Over!</h2>
              
              <div className="space-y-6 mb-8">
                {game.teams
                  .sort((a, b) => b.score - a.score)
                  .map((team, index) => (
                    <AnimatedCard key={team.id} delay={index * 200}>
                      <div className={`glass-card p-6 ${index === 0 ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-500/10 to-orange-500/10' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-4xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : `${index + 1}.`}</span>
                            <span className="text-xl font-bold">{team.name}</span>
                          </div>
                          <span className="text-3xl font-bold text-white">{team.score}</span>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))}
              </div>
              
              {selectedTeam === game.teams.sort((a, b) => b.score - a.score)[0].id && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl">
                  <p className="text-2xl text-green-400 font-bold">🎉 Congratulations! Your team won!</p>
                </div>
              )}
              
              <Link to="/" className="btn-primary py-4 px-12 text-xl">
                <span className="mr-3">🏠</span> JOIN ANOTHER GAME
              </Link>
            </div>
          </AnimatedCard>
        )}
      </main>
      
      <Footer />
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