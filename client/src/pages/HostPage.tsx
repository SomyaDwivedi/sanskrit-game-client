import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import io, { Socket } from "socket.io-client";

// Import components
import Header from "../components/Header";
import Footer from "../components/Footer";
import AnimatedCard from "../components/AnimatedCard";
import LoadingSpinner from "../components/LoadingSpinner";
import TeamPanel from "../components/TeamPanel";
import QuestionDisplay from "../components/QuestionDisplay";
import BuzzerDisplay from "../components/BuzzerDisplay";

// Import hooks
import { useAudio } from "../hooks/useAudio";
import { useTimer, useCountdownTimer } from "../hooks/useTimer";

// Import types and utils
import { Game } from "../types";
import {
  getCurrentQuestion,
  getGameStats,
  getGameWinner,
} from "../utils/gameHelper";
import { ROUTES } from "../utils/constants";

const HostPage: React.FC = () => {
  const [gameCode, setGameCode] = useState<string>("");
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [controlMessage, setControlMessage] = useState<string>("");
  const [currentBuzzer, setCurrentBuzzer] = useState<{
    playerName: string;
    teamName: string;
    timestamp: number;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Debug state
  console.log("🔍 Current component state:", {
    gameCode,
    game: !!game,
    gameStatus: game?.status,
  });

  // Hooks
  const { soundEnabled, toggleSound, playSound } = useAudio();
  const { timer } = useTimer(game?.status === "active");

  const {
    timeLeft: answerTimeLeft,
    start: startAnswerTimer,
    stop: stopAnswerTimer,
  } = useCountdownTimer(
    30,
    (secondsLeft) => {
      if (secondsLeft <= 5 && secondsLeft > 0) {
        playSound("timerTick");
      }
    },
    () => {
      playSound("timeout");
      setControlMessage("Time's up!");
    }
  );

  // Socket setup with improved reconnection logic
  const setupSocket = (gameCode: string) => {
    console.log("🔌 Setting up socket connection...");

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io("http://localhost:5000", {
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected successfully:", socket.id);

      // Join as host immediately after connection
      console.log("👑 Joining as host...");
      const defaultTeams = [
        { name: "Team Red", members: ["Captain Red", "", "", "", ""] },
        { name: "Team Blue", members: ["Captain Blue", "", "", "", ""] },
      ];

      socket.emit("host-join", { gameCode, teams: defaultTeams });
    });

    socket.on("host-joined", (gameData) => {
      console.log("🎯 Host joined successfully! Game data:", gameData);
      console.log("Initial players in game:", gameData.players?.length || 0);
      setGame(gameData);
      setControlMessage("Waiting for players to join...");

      // Request current players list to make sure we have everyone
      socket.emit("get-players", { gameCode });
    });

    socket.on("game-started", (data) => {
      console.log("🚀 Game started event received!");
      setGame(data.game);
      setCurrentBuzzer(null);
      playSound("correct");
      setControlMessage("Game started! Get ready to play.");
    });

    socket.on("player-joined", (data) => {
      console.log("👤 Player joined event received:", data);
      playSound("buzz");

      if (data.player) {
        setGame((prev) => {
          if (!prev) return null;

          // Check if player already exists to avoid duplicates
          const playerExists = prev.players.some(
            (p) => p.id === data.player.id
          );
          if (playerExists) {
            console.log("Player already exists, not adding duplicate");
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === data.player.id ? { ...p, ...data.player } : p
              ),
            };
          }

          console.log("Adding new player to game:", data.player.name);
          const updatedGame = {
            ...prev,
            players: [...prev.players, data.player],
          };
          console.log("Updated players count:", updatedGame.players.length);
          return updatedGame;
        });
      }
    });

    socket.on("player-buzzed", (data) => {
      console.log("🔔 Player buzzed:", data.playerName);
      setGame(data.game);
      playSound("buzz");

      setCurrentBuzzer({
        playerName: data.playerName,
        teamName: data.teamName,
        timestamp: data.timestamp,
      });

      startAnswerTimer(30);
    });

    socket.on("answer-revealed", (data) => {
      setGame(data.game);
      if (data.byHost) {
        playSound("correct");
      }
    });

    socket.on("next-question", (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      stopAnswerTimer();
      setControlMessage("New question! Get ready to play.");
      playSound("nextQuestion");
    });

    socket.on("game-over", (data) => {
      setGame(data.game);
      playSound("applause");
      setControlMessage("Game Over! Check out the final results.");
    });

    socket.on("buzzer-cleared", (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      stopAnswerTimer();
    });

    socket.on("wrong-answer", (data) => {
      setGame(data.game);
      playSound("wrong");
      setControlMessage(
        `${data.teamName} got it wrong! Strike ${data.strikes}. ${
          data.strikes >= 3 ? "Switching teams!" : ""
        }`
      );
      stopAnswerTimer();
    });

    socket.on("team-switched", (data) => {
      setGame(data.game);
      playSound("buzz");
      setControlMessage(`Now ${data.activeTeamName}'s turn to answer!`);
    });
    socket.on("game-state-reset", (data) => {
      console.log("🔄 Game state reset event received");
      setGame(data.game);
      setCurrentBuzzer(null);
      stopAnswerTimer();
      setControlMessage("Game state has been reset by host.");
    });

    socket.on("strike-added", (data) => {
      console.log("⚠️ Strike added event received");
      setGame(data.game);
      setControlMessage(`Strike added! Team now has ${data.strikes} strikes.`);
    });

    socket.on("answer-correct", (data) => {
      setGame(data.game);
      playSound("correct");
      setControlMessage(
        `${data.teamName} got it right! +${data.pointsAwarded} points`
      );
      stopAnswerTimer();
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setControlMessage("Connection error. Please try again.");
    });

    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
      setControlMessage(`Socket error: ${error.message || error}`);
    });

    socket.on("players-list", (data) => {
      console.log("📋 Received players list:", data);
      if (data.players && data.players.length > 0) {
        setGame((prevGame) => {
          if (!prevGame) return null;
          return {
            ...prevGame,
            players: data.players,
          };
        });
      }
    });

    socket.on("team-updated", (data) => {
      console.log("🔄 Team updated:", data);
      setGame(data.game);
    });

    return socket;
  };

  const createGame = async () => {
    console.log("🎮 Creating new game...");
    setIsLoading(true);
    setControlMessage("");

    try {
      // Create the axios instance with proper configuration
      const apiClient = axios.create({
        baseURL: "http://localhost:5000",
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Test connection
      const testResponse = await apiClient.get("/");
      console.log("✅ Server connection successful:", testResponse.data);

      // Create the game
      console.log("Creating game...");
      const response = await apiClient.post("/api/create-game");
      console.log("✅ Game creation response:", response.data);

      const { gameCode: newGameCode } = response.data;
      setGameCode(newGameCode);
      setControlMessage(`Game created successfully! Code: ${newGameCode}`);

      // Setup socket connection
      setupSocket(newGameCode);
    } catch (error: unknown) {
      console.error("❌ Error creating game:", error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
          setControlMessage(
            "Cannot connect to server. Make sure the server is running on http://localhost:5000"
          );
        } else if (error.response) {
          setControlMessage(
            `Server error: ${
              error.response.data?.error || error.response.statusText
            }`
          );
        } else if (error.request) {
          setControlMessage(
            "No response from server. Please check if the server is running."
          );
        } else {
          setControlMessage(`Request error: ${error.message}`);
        }
      } else if (error instanceof Error) {
        setControlMessage(`Error: ${error.message}`);
      } else {
        setControlMessage("An unexpected error occurred. Please try again.");
      }
    }
    setIsLoading(false);
  };

  const handleStartGame = () => {
    console.log("🎮 Starting game...");

    if (gameCode && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("start-game", { gameCode });
    } else {
      console.error("❌ Cannot start game - missing requirements");
      setControlMessage("Cannot start game. Please check your connection.");
    }
  };

  const handleRevealAnswer = (answerIndex: number) => {
    if (gameCode && game && socketRef.current) {
      const answer =
        game.questions[game.currentQuestionIndex]?.answers[answerIndex];

      if (answer && !answer.revealed) {
        socketRef.current.emit("reveal-answer", { gameCode, answerIndex });
        // Points will be automatically awarded by the server
      }
    }
  };

  const handleNextQuestion = () => {
    if (gameCode && socketRef.current) {
      socketRef.current.emit("next-question", { gameCode });
      // Automatically reset strikes and switch to team 1
    }
  };

  // Request updated player list periodically when in waiting state
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (game && game.status === "waiting" && socketRef.current) {
      // Initial request
      socketRef.current.emit("get-players", { gameCode });

      interval = setInterval(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit("get-players", { gameCode });
        }
      }, 3000); // Every 3 seconds (more frequent updates)
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [game?.status, gameCode]);

  // Attempt to reconnect socket if disconnected
  useEffect(() => {
    let reconnectInterval: NodeJS.Timeout;

    if (gameCode && !socketRef.current?.connected) {
      reconnectInterval = setInterval(() => {
        console.log("Attempting to reconnect socket...");
        setupSocket(gameCode);
      }, 5000); // Try to reconnect every 5 seconds
    }

    return () => {
      if (reconnectInterval) clearInterval(reconnectInterval);
    };
  }, [gameCode, socketRef.current?.connected]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const currentQuestion = game ? getCurrentQuestion(game) : null;

  // Not created yet - show creation form
  if (!gameCode) {
    console.log("📱 Rendering: Game creation form");
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={soundEnabled} onToggleSound={toggleSound} />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-8 text-center">
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
                    to={ROUTES.HOME}
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

  // Game created but waiting for players
  if (game && game.status === "waiting") {
    console.log("⏳ Rendering: Waiting for players");
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={gameCode}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-8 text-center">
                <h2 className="text-3xl font-bold mb-6">Game Setup</h2>

                <div className="mb-8">
                  <p className="text-lg text-slate-300 mb-2">
                    Share this code with contestants:
                  </p>
                  <div className="text-5xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                    {gameCode}
                  </div>
                </div>

                {/* Debug info - can be removed later */}
                <div className="mb-6 p-4 bg-slate-800/50 rounded text-sm text-left">
                  <p>
                    <strong>Debug Info:</strong>
                  </p>
                  <p>Players array length: {game.players?.length || 0}</p>
                  <p>Game Code: {gameCode}</p>
                  <p>
                    Socket Connected:{" "}
                    {socketRef.current?.connected ? "Yes" : "No"}
                  </p>
                  <p>Game Status: {game.status}</p>
                </div>

                {/* Start game button */}
                <button
                  onClick={handleStartGame}
                  className="btn-success py-4 px-12 text-xl mb-6"
                  disabled={
                    game.players.length === 0 ||
                    game.players.some((p) => !p.teamId)
                  }
                >
                  <span className="text-2xl mr-3">🎮</span>
                  BEGIN COMPETITION
                </button>

                {game.players && game.players.length > 0 && (
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
                            {player.teamId && (
                              <span className="ml-auto text-xs bg-slate-700 px-2 py-1 rounded">
                                {
                                  game.teams.find((t) => t.id === player.teamId)
                                    ?.name
                                }
                              </span>
                            )}
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AnimatedCard>
        </main>

        <Footer />
      </div>
    );
  }

  // If we have a gameCode but no game, show a loading state
  if (gameCode && !game) {
    console.log("🔄 Rendering: Loading state (have gameCode but no game)");
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <LoadingSpinner />
            <p className="mt-4 text-slate-400">Setting up game...</p>
            <p className="text-sm text-slate-500 mt-2">Game Code: {gameCode}</p>
            {controlMessage && (
              <p className="text-sm text-blue-400 mt-2">{controlMessage}</p>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Active Game
  if (game?.status === "active" && currentQuestion) {
    console.log("🎮 Rendering: Active game");
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={gameCode}
          timer={timer}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <AnimatedCard className="lg:col-span-1">
              <TeamPanel
                team={game.teams[0]}
                teamIndex={0}
                isActive={game.teams[0]?.active}
              />
            </AnimatedCard>

            <AnimatedCard className="lg:col-span-2">
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    Round {game.currentRound}
                  </h2>
                  <div className="text-slate-400">
                    Question {game.currentQuestionIndex + 1} of{" "}
                    {game.questions.length}
                  </div>
                </div>

                <QuestionDisplay
                  question={currentQuestion}
                  currentRound={game.currentRound}
                  questionIndex={game.currentQuestionIndex}
                  totalQuestions={game.questions.length}
                  onRevealAnswer={handleRevealAnswer}
                  isHost={true}
                />

                {controlMessage && (
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg text-center">
                    <p className="text-blue-300">{controlMessage}</p>
                  </div>
                )}

                {/* Enhanced Control Panel for New Mechanics */}
                {/* Simplified Host Controls - Automatic Game Management */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      if (socketRef.current) {
                        socketRef.current.emit("clear-buzzer", { gameCode });
                      }
                    }}
                    className="btn-secondary py-2 px-4"
                  >
                    🔄 Reset Buzzer
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    className="btn-primary py-2 px-4"
                  >
                    ➡️ Next Question
                  </button>
                </div>

                {/* Real-time Game State Display */}
                <div className="mt-4 glass-card p-4 bg-slate-800/50">
                  <h4 className="font-semibold text-slate-300 mb-3">
                    📊 Live Game State
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Buzzer Info */}
                    <div className="text-center">
                      <div className="text-sm text-slate-400 mb-1">
                        Current Buzzer
                      </div>
                      <div className="text-lg font-semibold">
                        {game.currentBuzzer ? (
                          <span className="text-yellow-400">
                            🔔 {game.currentBuzzer.playerName}
                          </span>
                        ) : (
                          <span className="text-gray-400">Open for all</span>
                        )}
                      </div>
                      {game.currentBuzzer && (
                        <div className="text-xs text-blue-300 mt-1">
                          {game.currentBuzzer.teamName}
                        </div>
                      )}
                    </div>

                    {/* Active Team Info */}
                    <div className="text-center">
                      <div className="text-sm text-slate-400 mb-1">
                        Active Team
                      </div>
                      <div className="text-lg font-semibold">
                        {game.gameState?.activeTeamId ? (
                          <span className="text-green-400">
                            ✅{" "}
                            {
                              game.teams.find(
                                (t) => t.id === game.gameState?.activeTeamId
                              )?.name
                            }
                          </span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                      <div className="text-xs mt-1">
                        <span
                          className={
                            game.gameState?.inputEnabled
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          Input:{" "}
                          {game.gameState?.inputEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </div>

                    {/* Question Progress */}
                    <div className="text-center">
                      <div className="text-sm text-slate-400 mb-1">
                        Progress
                      </div>
                      <div className="text-lg font-semibold text-purple-400">
                        Q{game.currentQuestionIndex + 1}/{game.questions.length}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Round {game.currentRound}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Status Cards */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.teams.map((team, index) => (
                    <div
                      key={team.id}
                      className={`glass-card p-4 ${
                        team.id === game.gameState?.activeTeamId
                          ? "border-green-500/50 bg-green-500/10 animate-pulse-slow"
                          : "border-slate-500/50"
                      }`}
                    >
                      <div className="text-center">
                        <h4 className="font-semibold text-lg mb-2">
                          {team.name}
                        </h4>
                        <div className="text-3xl font-bold mb-2">
                          {team.score}
                        </div>

                        {/* Strike Display */}
                        <div className="flex justify-center gap-1 mb-3">
                          {[1, 2, 3].map((strike) => (
                            <div
                              key={strike}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                                strike <= team.strikes
                                  ? "bg-red-500 border-red-500 text-white animate-strike"
                                  : "border-slate-600 text-slate-600"
                              }`}
                            >
                              {strike <= team.strikes ? "✗" : strike}
                            </div>
                          ))}
                        </div>

                        {/* Team Status */}
                        <div className="text-sm">
                          {team.id === game.gameState?.activeTeamId && (
                            <div className="bg-green-600/20 text-green-300 px-2 py-1 rounded mb-2">
                              🎯 Currently Answering
                            </div>
                          )}
                          {team.strikes >= 3 && (
                            <div className="bg-red-600/20 text-red-300 px-2 py-1 rounded mb-2">
                              💔 Struck Out
                            </div>
                          )}

                          {/* Show team members */}
                          <div className="text-xs text-slate-400">
                            Players:{" "}
                            {game.players
                              .filter((p) => p.teamId === team.id)
                              .map((p) => p.name)
                              .join(", ") || "None"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {controlMessage && (
                  <div className="mt-4 p-3 bg-blue-900/30 rounded-lg text-center border border-blue-500/30">
                    <p className="text-blue-300 font-medium">
                      {controlMessage}
                    </p>
                  </div>
                )}

                {/* Team Control Panel */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.teams.map((team) => (
                    <div key={team.id} className="glass-card p-3">
                      <h4 className="font-semibold text-center mb-2">
                        {team.name}
                      </h4>
                      <div className="text-center mb-2">
                        <span className="text-sm text-slate-400">
                          Strikes: {team.strikes}/3 | Score: {team.score}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            if (socketRef.current) {
                              socketRef.current.emit("force-team-switch", {
                                gameCode,
                                teamId: team.id,
                              });
                            }
                          }}
                          className={`py-1 px-3 text-xs border rounded ${
                            game.gameState?.activeTeamId === team.id
                              ? "bg-green-600 text-white border-green-500"
                              : "bg-slate-600 text-white border-slate-500 hover:bg-slate-500"
                          }`}
                        >
                          {game.gameState?.activeTeamId === team.id
                            ? "✓ Active Team"
                            : "Make Active"}
                        </button>
                        <button
                          onClick={() => {
                            if (socketRef.current) {
                              socketRef.current.emit("add-strike", {
                                gameCode,
                                teamId: team.id,
                              });
                            }
                          }}
                          className="py-1 px-3 text-xs bg-yellow-600 text-white border border-yellow-500 rounded hover:bg-yellow-500"
                          disabled={team.strikes >= 3}
                        >
                          Add Strike ({team.strikes}/3)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Game State Display */}
                <div className="mt-4 glass-card p-4 bg-slate-800/50">
                  <h4 className="font-semibold text-slate-300 mb-3">
                    Game State Info
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Active Team:</span>
                      <span className="ml-2 text-blue-300">
                        {game.gameState?.activeTeamId
                          ? game.teams.find(
                              (t) => t.id === game.gameState?.activeTeamId
                            )?.name
                          : "None"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Input Enabled:</span>
                      <span
                        className={`ml-2 ${
                          game.gameState?.inputEnabled
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {game.gameState?.inputEnabled ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Current Buzzer:</span>
                      <span className="ml-2 text-yellow-300">
                        {game.currentBuzzer?.playerName || "None"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Question:</span>
                      <span className="ml-2 text-purple-300">
                        {game.currentQuestionIndex + 1} of{" "}
                        {game.questions.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {game.currentBuzzer && (
                <AnimatedCard className="mt-4">
                  <BuzzerDisplay
                    currentBuzzer={currentBuzzer}
                    answerTimeLeft={answerTimeLeft}
                    onNextQuestion={handleNextQuestion}
                    isHost={true}
                  />
                </AnimatedCard>
              )}
            </AnimatedCard>

            <AnimatedCard className="lg:col-span-1">
              <TeamPanel
                team={game.teams[1]}
                teamIndex={1}
                isActive={game.teams[1]?.active}
              />
            </AnimatedCard>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Results Screen
  if (game?.status === "finished") {
    console.log("🏆 Rendering: Results screen");
    const winner = getGameWinner(game.teams);
    const stats = getGameStats(game);

    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={gameCode}
          timer={timer}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-12 text-center">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-8 rounded-2xl mb-8 animate-celebration">
                  <h2 className="text-5xl font-bold mb-4">🏆 CHAMPIONS 🏆</h2>
                  <p className="text-3xl font-bold">{winner.name}</p>
                  <p className="text-xl mt-2">Score: {winner.score}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {game.teams
                    .sort((a, b) => b.score - a.score)
                    .map((team, index) => (
                      <div
                        key={team.id}
                        className={`glass-card p-6 ${
                          index === 0
                            ? "border-yellow-400/50 bg-yellow-400/10"
                            : ""
                        }`}
                      >
                        <h3 className="text-xl font-semibold mb-2">
                          {team.name}
                        </h3>
                        <p className="text-2xl font-bold mb-1">{team.score}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {team.members.map((member, i) => (
                            <span
                              key={i}
                              className="text-sm bg-slate-700 px-2 py-1 rounded"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                <button
                  onClick={createGame}
                  className="btn-primary py-3 px-8 text-lg mr-4"
                >
                  Create New Game
                </button>

                <Link
                  to={ROUTES.HOME}
                  className="btn-secondary py-3 px-8 text-lg"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </AnimatedCard>
        </main>

        <Footer />
      </div>
    );
  }

  // Fallback for any unexpected game state
  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header
        gameCode={gameCode}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <AnimatedCard>
          <div className="glass-card p-8 text-center">
            <p className="text-xl font-bold mb-4">Unexpected Game State</p>
            <p className="text-slate-400 mb-4">
              The game is in an unexpected state. Please refresh the page or
              create a new game.
            </p>
            <Link to={ROUTES.HOME} className="btn-primary py-2 px-6">
              Back to Home
            </Link>
          </div>
        </AnimatedCard>
      </main>
      <Footer />
    </div>
  );
};

export default HostPage;
