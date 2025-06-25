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

// Import hooks
import { useAudio } from "../hooks/useAudio";
import { useTimer, useCountdownTimer } from "../hooks/useTimer";

// Import types and utils
import { Game, Team } from "../types";
import { getCurrentQuestion, getGameWinner } from "../utils/gameHelper";
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

  // Hooks
  const { soundEnabled, toggleSound } = useAudio();
  const { timer } = useTimer(game?.status === "active");

  const {
    timeLeft: answerTimeLeft,
    start: startAnswerTimer,
    stop: stopAnswerTimer,
  } = useCountdownTimer(
    30,
    (secondsLeft) => {
      // Removed timer tick sound
    },
    () => {
      // Removed timeout sound
      setControlMessage("Time's up!");
    }
  );

  // Socket setup with improved reconnection logic
  const setupSocket = React.useCallback((gameCode: string) => {
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
      // Removed sound
      setControlMessage("Game started! Get ready to play.");
    });

    socket.on("player-joined", (data) => {
      console.log("👤 Player joined event received:", data);
      // Removed sound

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
      // Removed sound

      setCurrentBuzzer({
        playerName: data.playerName,
        teamName: data.teamName,
        timestamp: data.timestamp,
      });

      startAnswerTimer(30);
    });

    socket.on("answer-revealed", (data) => {
      setGame(data.game);
      // Removed sound
    });

    socket.on("next-question", (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      stopAnswerTimer();
      setControlMessage("New question! Get ready to play.");
      // Removed sound
    });

    socket.on("game-over", (data) => {
      setGame(data.game);
      // Removed sound
      setControlMessage("Game Over! Check out the final results.");
    });

    socket.on("buzzer-cleared", (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      stopAnswerTimer();
    });

    socket.on("wrong-answer", (data: any) => {
      setGame(data.game);
      // Removed sound

      // Check if any team has 3 strikes - end game immediately
      const teamWithThreeStrikes = data.game.teams.find(
        (team: Team) => team.strikes >= 3
      );
      if (teamWithThreeStrikes) {
        console.log(
          `💀 ${teamWithThreeStrikes.name} reached 3 strikes! Ending game...`
        );

        // Determine winner (team with fewer strikes, or higher score if tied)
        const winner =
          data.game.teams.find(
            (team: Team) => team.id !== teamWithThreeStrikes.id
          ) ||
          data.game.teams.reduce((prev: Team, current: Team) =>
            prev.score > current.score ? prev : current
          );

        // Update game status to finished
        const finishedGame = { ...data.game, status: "finished" };
        setGame(finishedGame);
        setControlMessage(
          `Game Over! ${teamWithThreeStrikes.name} struck out. ${winner.name} wins!`
        );

        // Emit game over to all players
        if (socketRef.current) {
          socketRef.current.emit("force-game-over", {
            gameCode,
            reason: "three-strikes",
            winner,
            loser: teamWithThreeStrikes,
          });
        }

        return;
      }

      setControlMessage(
        `${data.teamName} got it wrong! Strike ${data.strikes}. ${
          data.strikes >= 3 ? "Game Over!" : ""
        }`
      );
      stopAnswerTimer();
    });

    socket.on("team-switched", (data: any) => {
      setGame(data.game);
      // Removed sound
      setControlMessage(`Now ${data.activeTeamName}'s turn to answer!`);
    });

    socket.on("answer-correct", (data: any) => {
      setGame(data.game);
      // Removed sound
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

    socket.on("players-list", (data: any) => {
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

    socket.on("team-updated", (data: any) => {
      console.log("🔄 Team updated:", data);
      setGame(data.game);
    });

    return socket;
  }, []); // Empty dependency array since we don't want to recreate this function

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
  }, [game?.status, gameCode]); // Removed game?.players?.length to fix warning

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
  }, [gameCode, socketRef.current?.connected, setupSocket]);

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
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={false} onToggleSound={undefined} />

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
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={gameCode}
          soundEnabled={false}
          onToggleSound={undefined}
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
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={false} onToggleSound={undefined} />
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

  // Active Game - LANDSCAPE LAYOUT
  if (game?.status === "active" && currentQuestion) {
    return (
      <div className="h-screen flex flex-col gradient-bg overflow-hidden">
        <Header
          gameCode={gameCode}
          timer={timer}
          soundEnabled={false}
          onToggleSound={undefined}
        />

        <main className="flex-1 flex gap-2 p-2 overflow-hidden">
          {/* Left Team Panel */}
          <div className="w-48 flex-shrink-0">
            <TeamPanel
              team={game.teams[0]}
              teamIndex={0}
              isActive={game.teams[0]?.active}
            />
          </div>

          {/* Center Game Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Question Header */}
            <div className="glass-card p-2 mb-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold">
                  Round {game.currentRound} • {currentQuestion.category}
                </h2>
                <div className="text-xs text-slate-400">
                  Question {game.currentQuestionIndex + 1} of{" "}
                  {game.questions.length}
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="glass-card p-3 mb-2">
              <h2 className="text-lg font-semibold text-center mb-1">
                {currentQuestion.question}
              </h2>
              
            </div>

            {/* Answers Grid - Host View (Always Shows All Answers) */}
            <div className="flex-1 grid grid-cols-2 gap-2 mb-2 overflow-auto">
              {currentQuestion.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`glass-card p-2 transition-all ${
                    answer.revealed
                      ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                      : "bg-gradient-to-r from-slate-700/20 to-slate-600/20 border-slate-500/30"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">
                      <span
                        className={
                          answer.revealed ? "text-green-300" : "text-slate-300"
                        }
                      >
                        {index + 1}. {answer.text}
                      </span>
                      {answer.revealed && (
                        <span className="ml-2 text-green-400 text-xs">
                          ✓ REVEALED
                        </span>
                      )}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        answer.revealed
                          ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                          : "bg-slate-600 text-slate-300"
                      }`}
                    >
                      {answer.points * game.currentRound}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Buzzer Display - FIXED: Added null check */}
            {game.currentBuzzer && currentBuzzer && (
              <div className="glass-card p-2 mb-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-yellow-400 text-sm">
                      <span className="animate-pulse">🔔</span>{" "}
                      {currentBuzzer.playerName} buzzed in!
                    </h3>
                    <p className="text-xs text-slate-400">
                      Team: {currentBuzzer.teamName}
                    </p>
                  </div>
                  {answerTimeLeft > 0 && (
                    <div className="text-center">
                      <span
                        className={`font-bold text-sm ${
                          answerTimeLeft <= 5
                            ? "text-red-400 animate-pulse"
                            : "text-blue-400"
                        }`}
                      >
                        {answerTimeLeft}s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Host Controls */}
            <div className="glass-card p-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (socketRef.current) {
                        socketRef.current.emit("clear-buzzer", { gameCode });
                      }
                    }}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    🔄 Reset
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="btn-primary text-xs py-1 px-3"
                  >
                    ➡️ Next
                  </button>
                </div>
                {controlMessage && (
                  <div className="text-blue-300 text-xs">{controlMessage}</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Team Panel */}
          <div className="w-48 flex-shrink-0">
            <TeamPanel
              team={game.teams[1]}
              teamIndex={1}
              isActive={game.teams[1]?.active}
            />
          </div>
        </main>
      </div>
    );
  }

  // Results Screen
  if (game?.status === "finished") {
    const winner = getGameWinner(game.teams);

    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={gameCode}
          timer={timer}
          soundEnabled={false}
          onToggleSound={undefined}
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
