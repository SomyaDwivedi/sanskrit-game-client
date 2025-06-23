import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import io, { Socket } from "socket.io-client";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./index.css";
import AudioManager from "./AudioManager";
import { Game, Question, Answer, Team, Player } from "./types";

// Initialize audio manager
const audioManager = new AudioManager();

// Reusable Components
const Logo: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="text-3xl animate-float">🎮</div>
    <div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
        Family Feud Quiz
      </h1>
      <p className="text-xs text-slate-400">Interactive Team Quiz Game</p>
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
              {soundEnabled ? "🔊" : "🔇"}
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
        © 2025 Quiz Game • Developed for Educational Purposes
      </p>
    </div>
  </footer>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="spinner"></div>
  </div>
);

const AnimatedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = "", delay = 0 }) => (
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
            <div className="text-6xl mb-6 animate-float">🎮</div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent animate-gradient">
              Family Feud Quiz
            </h1>
            <p className="text-xl text-slate-300 mb-2">Interactive Team Quiz</p>
            <p className="text-lg text-slate-400 mb-12">
              An exciting buzzer-based competition for teams
            </p>
          </AnimatedCard>

          <div className="flex flex-col md:flex-row gap-6 max-w-2xl mx-auto">
            <AnimatedCard className="flex-1" delay={200}>
              <button
                onClick={() => navigate("/host")}
                className="btn-primary w-full py-6 text-xl group"
              >
                <span className="text-3xl mr-3 group-hover:animate-bounce">
                  👑
                </span>
                HOST GAME
                <span className="block text-sm text-blue-200 mt-1">
                  Create & manage a competition
                </span>
              </button>
            </AnimatedCard>

            <AnimatedCard className="flex-1" delay={400}>
              <button
                onClick={() => navigate("/join")}
                className="btn-success w-full py-6 text-xl group"
              >
                <span className="text-3xl mr-3 group-hover:animate-bounce">
                  🎯
                </span>
                JOIN GAME
                <span className="block text-sm text-green-200 mt-1">
                  Enter as a contestant
                </span>
              </button>
            </AnimatedCard>
          </div>

          <AnimatedCard delay={600}>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="glass-card p-6 hover-lift">
                <div className="text-4xl mb-3">🔔</div>
                <h3 className="text-lg font-semibold mb-2">Buzzer System</h3>
                <p className="text-sm text-slate-400">
                  Fast-paced buzzer competition with turn-based answers
                </p>
              </div>

              <div className="glass-card p-6 hover-lift">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-lg font-semibold mb-2">Team Play</h3>
                <p className="text-sm text-slate-400">
                  Compete in teams with alternating turns and strikes system
                </p>
              </div>

              <div className="glass-card p-6 hover-lift">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="text-lg font-semibold mb-2">Points System</h3>
                <p className="text-sm text-slate-400">
                  Earn points for correct answers and compete for high scores
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
  const [gameCode, setGameCode] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState("00:00");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentBuzzer, setCurrentBuzzer] = useState<{
    playerName: string;
    teamName: string;
    timestamp: number;
  } | null>(null);
  const [answerTimeLeft, setAnswerTimeLeft] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [controlMessage, setControlMessage] = useState<string>("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (game?.status === "active") {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setTimer(
          `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [game?.status]);

  const handleToggleSound = () => {
    const newState = audioManager.toggleSound();
    setSoundEnabled(newState);
  };

  const createGame = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/create-game");
      const { gameCode } = response.data;
      setGameCode(gameCode);

      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);

      // Use fixed team names
      const defaultTeams = [
        { name: "Team Red", members: ["Captain Red", "", "", "", ""] },
        { name: "Team Blue", members: ["Captain Blue", "", "", "", ""] },
      ];

      newSocket.emit("host-join", { gameCode, teams: defaultTeams });

      newSocket.on("host-joined", (gameData: Game) => {
        setGame(gameData);
      });

      newSocket.on("player-joined", (data) => {
        audioManager.playSound("buzz");
        setGame((prev) =>
          prev ? { ...prev, players: [...prev.players, data.player] } : null
        );
      });

      setupSocketListeners(newSocket);
    } catch (error) {
      console.error("Error creating game:", error);
    }
    setIsLoading(false);
  };

  const setupSocketListeners = (socket: Socket) => {
    socket.on("game-started", (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      audioManager.playSound("correct");
    });

    socket.on("buzzer-opened", (data) => {
      setCurrentBuzzer(null);
      setActiveTeam(data.activeTeam);
      setControlMessage(`Buzzer is open for ${data.message}`);
    });

    socket.on("player-buzzed", (data) => {
      setGame(data.game);
      setActiveTeam(data.teamId);

      audioManager.playSound("buzz");

      // Get the team name
      const teamName = data.teamName || "Unknown Team";

      setCurrentBuzzer({
        playerName: data.playerName,
        teamName: teamName,
        timestamp: data.timestamp,
      });

      // Start answer countdown timer
      startAnswerCountdown(data.game.buzzerState.answerTimeLimit);
    });

    socket.on("answer-timer-started", (data) => {
      startAnswerCountdown(data.timeLimit);
    });

    socket.on("team-switched", (data) => {
      setGame(data.game);
      setActiveTeam(data.activeTeamId);
      setControlMessage(`Now ${data.activeTeamName}'s turn to answer!`);
      audioManager.playSound("buzz");
    });

    socket.on("answer-correct", (data) => {
      setGame(data.game);
      audioManager.playSound("correct");
      setControlMessage(
        `${data.teamName} got it right! +${data.pointsAwarded} points`
      );
      clearAnswerCountdown();
    });

    socket.on("answer-incorrect", (data) => {
      setGame(data.game);
      audioManager.playSound("wrong");
      setControlMessage(
        `${data.teamName} got it wrong! Strike ${data.strikes}`
      );
    });

    socket.on("answer-timeout", (data) => {
      setGame(data.game);
      audioManager.playSound("timeout");
      setControlMessage(
        `Time's up for ${data.teamName}! Strike ${data.strikes}`
      );
    });

    socket.on("team-out", (data) => {
      setGame(data.game);
      audioManager.playSound("wrong");
      setControlMessage(
        `${data.teamName} has 3 strikes and is out for this question!`
      );
    });

    socket.on("turn-skipped", (data) => {
      setGame(data.game);
      audioManager.playSound("buzz");
      setControlMessage(`${data.teamName} skipped their turn!`);
    });

    socket.on("answer-revealed", (data) => {
      setGame(data.game);
      if (data.byHost) {
        audioManager.playSound("correct");
      }
    });

    socket.on("question-closed", (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      setActiveTeam(null);
      clearAnswerCountdown();
      setControlMessage(data.message);
    });

    socket.on("next-question", (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      setActiveTeam(null);
      clearAnswerCountdown();
      setControlMessage("New question! Get ready to play.");
      audioManager.playSound("nextQuestion");
    });

    socket.on("game-over", (data) => {
      setGame(data.game);
      audioManager.playSound("applause");
    });
  };

  // Start answer countdown timer
  const startAnswerCountdown = (milliseconds: number) => {
    clearAnswerCountdown(); // Clear any existing timer

    const endTime = Date.now() + milliseconds;

    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setAnswerTimeLeft(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        clearInterval(interval);
      }

      // Play tick sound for last 5 seconds
      if (Math.ceil(remaining / 1000) <= 5 && Math.ceil(remaining / 1000) > 0) {
        audioManager.playTimerTick(Math.ceil(remaining / 1000));
      }
    }, 100);

    setTimerInterval(interval);
  };

  // Clear answer countdown timer
  const clearAnswerCountdown = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setAnswerTimeLeft(0);
  };

  const startGame = () => {
    if (socket && gameCode) {
      socket.emit("start-game", { gameCode });
    }
  };

  const revealAnswer = (answerIndex: number) => {
    if (socket && gameCode && game) {
      const answer =
        game.questions[game.currentQuestionIndex]?.answers[answerIndex];
      if (answer && !answer.revealed) {
        socket.emit("reveal-answer", { gameCode, answerIndex });
      }
    }
  };

  const nextQuestion = () => {
    if (socket && gameCode) {
      socket.emit("next-question", { gameCode });
    }
  };

  const openBuzzer = () => {
    if (socket && gameCode) {
      socket.emit("open-buzzer", { gameCode });
    }
  };

  // Render buzzer display component
  const renderBuzzerDisplay = () => {
    return (
      <AnimatedCard delay={50}>
        <div className="glass-card p-4 mb-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div>
              {currentBuzzer ? (
                <>
                  <h3 className="font-bold text-yellow-400">
                    <span className="animate-pulse">🔔</span>{" "}
                    {currentBuzzer.playerName} buzzed in!
                  </h3>
                  <p className="text-sm text-slate-400">
                    Team: {currentBuzzer.teamName}
                  </p>
                </>
              ) : (
                <h3 className="font-bold text-slate-300">
                  Waiting for teams to buzz in...
                </h3>
              )}

              {answerTimeLeft > 0 && (
                <div className="mt-2">
                  <span
                    className={`font-bold ${
                      answerTimeLeft <= 5
                        ? "text-red-400 animate-pulse"
                        : "text-blue-400"
                    }`}
                  >
                    Time remaining: {answerTimeLeft}s
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentBuzzer && (
                <span className="text-sm text-slate-400">
                  {new Date(currentBuzzer.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}

              <button
                onClick={openBuzzer}
                className="btn-success text-xs py-1 px-2 mr-2"
                disabled={!!currentBuzzer}
              >
                Open Buzzer
              </button>

              <button
                onClick={nextQuestion}
                className="btn-primary text-xs py-1 px-2"
              >
                Next Question
              </button>
            </div>
          </div>
        </div>
      </AnimatedCard>
    );
  };

  // Render control panel component
  const renderControlPanel = () => {
    return (
      <AnimatedCard delay={600}>
        <div className="glass-card p-4 mt-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-slate-300">
              Quiz Control Panel
            </h3>
            {controlMessage && (
              <p className="text-sm text-yellow-400 mt-1">{controlMessage}</p>
            )}
          </div>

          <div className="flex justify-between">
            <div className="text-slate-300">
              <span className="font-semibold">Buzzer System:</span> Teams take
              turns answering until all answers found or 3 strikes
            </div>
          </div>
        </div>
      </AnimatedCard>
    );
  };

  if (!gameCode) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={soundEnabled} onToggleSound={handleToggleSound} />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-8 text-center">
                <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  Host a New Game
                </h2>

                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4 flex items-center justify-center text-white text-4xl">
                    🎯
                  </div>
                  <p className="text-lg text-slate-300 mb-4">
                    Ready to host a buzzer-based quiz competition?
                  </p>
                  <p className="text-slate-400">
                    Click below to create a new game with Team Red vs Team Blue
                  </p>
                </div>

                <button
                  onClick={createGame}
                  disabled={isLoading}
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
                      CREATE GAME
                    </>
                  )}
                </button>

                <div className="mt-6">
                  <Link
                    to="/"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
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
      <Header
        gameCode={gameCode}
        timer={timer}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <main className="flex-1 container mx-auto px-4 py-4">
        {/* Waiting Screen */}
        {game?.status === "waiting" && (
          <AnimatedCard>
            <div className="max-w-2xl mx-auto text-center">
              <div className="glass-card p-8">
                <h2 className="text-3xl font-bold mb-6">Waiting for Players</h2>
                <div className="mb-8">
                  <p className="text-slate-400 mb-4">
                    Share this code with contestants:
                  </p>
                  <div className="text-5xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                    {gameCode}
                  </div>
                </div>

                {game.players.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Connected Players ({game.players.length})
                    </h3>
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
        {game?.status === "active" && currentQuestion && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Team 1 Panel */}
            <AnimatedCard className="lg:col-span-1">
              <div
                className={`glass-card p-6 h-full ${
                  game.teams[0]?.active
                    ? "ring-2 ring-orange-400 animate-pulse-slow"
                    : ""
                }`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">
                    {game.teams[0]?.name}
                  </h3>
                  <div className="text-5xl font-bold text-orange-400 mb-4 animate-score">
                    {game.teams[0]?.score}
                  </div>
                  <div className="text-sm text-slate-400">Points</div>
                </div>

                {game.teams[0]?.members && game.teams[0].members.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">
                      Team Members
                    </h4>
                    <div className="space-y-2">
                      {game.teams[0].members
                        .filter((m) => m)
                        .map((member, idx) => (
                          <div
                            key={idx}
                            className="text-sm glass-card p-2 flex items-center gap-2"
                          >
                            {idx === 0 && (
                              <span className="text-yellow-400">👑</span>
                            )}
                            {member}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Strikes display */}
                <div className="text-center">
                  <div className="flex justify-center gap-2 mb-2">
                    {[1, 2, 3].map((strike) => (
                      <div
                        key={strike}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                          strike <= (game.teams[0]?.strikes || 0)
                            ? "bg-red-500 border-red-500 text-white"
                            : "border-slate-600"
                        }`}
                      >
                        {strike <= (game.teams[0]?.strikes || 0) ? "✗" : ""}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-slate-400">Strikes</div>
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
                  <p className="text-sm text-slate-400">
                    Question {game.currentQuestionIndex + 1} of{" "}
                    {game.questions.length}
                  </p>
                </div>
              </AnimatedCard>

              {/* Buzzer Display */}
              {renderBuzzerDisplay()}

              <AnimatedCard delay={100}>
                <div className="glass-card p-8 mb-6">
                  <h2 className="text-2xl font-semibold text-center mb-4">
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
                          ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                          : "hover:border-blue-400"
                      }`}
                      onClick={() => !answer.revealed && revealAnswer(index)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">
                          {answer.revealed ? (
                            <span className="animate-reveal">
                              {index + 1}. {answer.text}
                            </span>
                          ) : (
                            `${index + 1}. ${"_".repeat(12)}`
                          )}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            answer.revealed
                              ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                              : "bg-slate-700"
                          }`}
                        >
                          {answer.revealed ? answer.points : "?"}
                        </span>
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>

              {/* Host Answer Reference */}
              <AnimatedCard delay={500}>
                <div className="glass-card p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
                  <h4 className="text-sm font-semibold text-purple-300 mb-3">
                    🔒 Host Reference (Hidden from Players)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {currentQuestion.answers.map((answer, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-slate-400"
                      >
                        <span>
                          {index + 1}. {answer.text}
                        </span>
                        <span className="font-bold text-yellow-400">
                          {answer.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedCard>

              {/* Control Panel */}
              {renderControlPanel()}
            </div>

            {/* Team 2 Panel */}
            {/* Team 2 Panel */}
            <AnimatedCard className="lg:col-span-1">
              <div
                className={`glass-card p-6 h-full ${
                  game.teams[1]?.active
                    ? "ring-2 ring-blue-400 animate-pulse-slow"
                    : ""
                }`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">
                    {game.teams[1]?.name}
                  </h3>
                  <div className="text-5xl font-bold text-blue-400 mb-4 animate-score">
                    {game.teams[1]?.score}
                  </div>
                  <div className="text-sm text-slate-400">Points</div>
                </div>

                {game.teams[1]?.members && game.teams[1].members.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">
                      Team Members
                    </h4>
                    <div className="space-y-2">
                      {game.teams[1].members
                        .filter((m) => m)
                        .map((member, idx) => (
                          <div
                            key={idx}
                            className="text-sm glass-card p-2 flex items-center gap-2"
                          >
                            {idx === 0 && (
                              <span className="text-yellow-400">👑</span>
                            )}
                            {member}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Strikes display */}
                <div className="text-center">
                  <div className="flex justify-center gap-2 mb-2">
                    {[1, 2, 3].map((strike) => (
                      <div
                        key={strike}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                          strike <= (game.teams[1]?.strikes || 0)
                            ? "bg-red-500 border-red-500 text-white"
                            : "border-slate-600"
                        }`}
                      >
                        {strike <= (game.teams[1]?.strikes || 0) ? "✗" : ""}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-slate-400">Strikes</div>
                </div>
              </div>
            </AnimatedCard>
          </div>
        )}

        {/* Results Screen */}
        {game?.status === "finished" && (
          <AnimatedCard>
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-12 text-center">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-8 rounded-2xl mb-8 animate-celebration">
                  <h2 className="text-5xl font-bold mb-4">🏆 CHAMPIONS 🏆</h2>
                  <p className="text-3xl font-bold">
                    {game?.teams.sort((a, b) => b.score - a.score)[0]?.name}
                  </p>
                  <p className="text-xl mt-2">
                    Score:{" "}
                    {game?.teams.sort((a, b) => b.score - a.score)[0]?.score}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {game?.teams
                    .sort((a, b) => b.score - a.score)
                    .map((team, index) => (
                      <AnimatedCard key={team.id} delay={index * 200}>
                        <div
                          className={`glass-card p-8 ${
                            index === 0 ? "ring-2 ring-yellow-400" : ""
                          }`}
                        >
                          <div className="text-6xl mb-4">
                            {index === 0 ? "🥇" : "🥈"}
                          </div>
                          <h3 className="text-2xl font-bold mb-4">
                            {team.name}
                          </h3>
                          <div
                            className={`text-4xl font-bold mb-2 ${
                              index === 0 ? "text-yellow-400" : "text-slate-400"
                            }`}
                          >
                            {team.score} Points
                          </div>
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-400 mb-2">
                              Team Members
                            </h4>
                            <div className="space-y-1">
                              {team.members?.map((member, idx) => (
                                <div key={idx} className="text-sm">
                                  {idx === 0 && "👑"} {member}
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
                    <div className="text-3xl font-bold text-blue-400">
                      {game?.questions.length}
                    </div>
                    <div className="text-sm text-slate-400">
                      Total Questions
                    </div>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {timer}
                    </div>
                    <div className="text-sm text-slate-400">Game Duration</div>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-red-400">
                      {(game?.teams[0]?.strikes || 0) +
                        (game?.teams[1]?.strikes || 0)}
                    </div>
                    <div className="text-sm text-slate-400">Total Strikes</div>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {Math.max(
                        ...(game?.questions.flatMap((q) =>
                          q.answers.map((a) => a.points)
                        ) || [0])
                      )}
                    </div>
                    <div className="text-sm text-slate-400">Highest Points</div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Link to="/" className="btn-primary py-3 px-8">
                    <span className="mr-2">🏠</span> NEW GAME
                  </Link>
                  <button
                    className="btn-accent py-3 px-8"
                    onClick={() => window.print()}
                  >
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
export default App;
