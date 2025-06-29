import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import io, { Socket } from "socket.io-client";

// Import components
import PageLayout from "../components/layout/PageLayout";
import AnimatedCard from "../components/common/AnimatedCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import TeamPanel from "../components/game/TeamPanel";
import GameBoard from "../components/game/GameBoard";
import GameResults from "../components/game/GameResults";
import PlayerList from "../components/game/PlayerList";
import GameCreationForm from "../components/forms/GameCreationForm";
import Button from "../components/common/Button";

// Import hooks and services

import { useTimer, useCountdownTimer } from "../hooks/useTimer";
import gameApi from "../services/gameApi";

// Import types and utils
import { Game, Team } from "../types";
import { getCurrentQuestion, getGameWinner } from "../utils/gameHelper";
import { ROUTES } from "../utils/constants";

const HostGamePage: React.FC = () => {
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
  const { timer } = useTimer(game?.status === "active");

  const {
    timeLeft: answerTimeLeft,
    start: startAnswerTimer,
    stop: stopAnswerTimer,
  } = useCountdownTimer(
    30,
    (secondsLeft) => {
      // Timer tick logic can be added here
    },
    () => {
      setControlMessage("Time's up!");
    }
  );

  // Socket setup with improved reconnection logic
  const setupSocket = React.useCallback(
    (gameCode: string) => {
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
        setControlMessage("Game started! Get ready to play.");
      });

      socket.on("player-joined", (data) => {
        console.log("👤 Player joined event received:", data);

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

        setCurrentBuzzer({
          playerName: data.playerName,
          teamName: data.teamName,
          timestamp: data.timestamp,
        });

        startAnswerTimer(30);
      });

      socket.on("answer-revealed", (data) => {
        setGame(data.game);
      });

      socket.on("next-question", (data) => {
        setGame(data.game);
        setCurrentBuzzer(null);
        stopAnswerTimer();
        setControlMessage("New question! Get ready to play.");
      });

      socket.on("game-over", (data) => {
        setGame(data.game);
        setControlMessage("Game Over! Check out the final results.");
      });

      socket.on("buzzer-cleared", (data) => {
        setGame(data.game);
        setCurrentBuzzer(null);
        stopAnswerTimer();
      });

      socket.on("wrong-answer", (data: any) => {
        setGame(data.game);

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
        setControlMessage(`Now ${data.activeTeamName}'s turn to answer!`);
      });

      socket.on("answer-correct", (data: any) => {
        setGame(data.game);
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
    },
    [startAnswerTimer, stopAnswerTimer]
  );

  const createGame = async () => {
    console.log("🎮 Creating new game...");
    setIsLoading(true);
    setControlMessage("");

    try {
      // Test connection
      const testResponse = await gameApi.testConnection();
      console.log("✅ Server connection successful:", testResponse);

      // Create the game
      console.log("Creating game...");
      const response = await gameApi.createGame();
      console.log("✅ Game creation response:", response);

      const { gameCode: newGameCode } = response;
      setGameCode(newGameCode);
      setControlMessage(`Game created successfully! Code: ${newGameCode}`);

      // Setup socket connection
      setupSocket(newGameCode);
    } catch (error: unknown) {
      console.error("❌ Error creating game:", error);

      // Handle different types of errors
      if (error instanceof Error) {
        if (
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("ERR_NETWORK")
        ) {
          setControlMessage(
            "Cannot connect to server. Make sure the server is running on http://localhost:5000"
          );
        } else {
          setControlMessage(`Error: ${error.message}`);
        }
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
    }
  };

  const handleClearBuzzer = () => {
    if (gameCode && socketRef.current) {
      socketRef.current.emit("clear-buzzer", { gameCode });
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
      }, 3000); // Every 3 seconds
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
      <PageLayout>
        <GameCreationForm onCreateGame={createGame} isLoading={isLoading} />
        {controlMessage && (
          <div className="mt-4 text-center">
            <div className="text-blue-400">{controlMessage}</div>
          </div>
        )}
      </PageLayout>
    );
  }

  // Game created but waiting for players
  if (game && game.status === "waiting") {
    return (
      <PageLayout gameCode={gameCode}>
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
              <Button
                onClick={handleStartGame}
                variant="success"
                size="xl"
                disabled={
                  game.players.length === 0 ||
                  game.players.some((p) => !p.teamId)
                }
                icon={<span className="text-2xl">🎮</span>}
                className="mb-6"
              >
                BEGIN COMPETITION
              </Button>

              {game.players && game.players.length > 0 && (
                <PlayerList
                  players={game.players}
                  teams={game.teams}
                  variant="waiting"
                />
              )}
            </div>
          </div>
        </AnimatedCard>
      </PageLayout>
    );
  }

  // If we have a gameCode but no game, show a loading state
  if (gameCode && !game) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <div className="glass-card p-8 text-center">
            <LoadingSpinner />
            <p className="mt-4 text-slate-400">Setting up game...</p>
            <p className="text-sm text-slate-500 mt-2">Game Code: {gameCode}</p>
            {controlMessage && (
              <p className="text-sm text-blue-400 mt-2">{controlMessage}</p>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Active Game - LANDSCAPE LAYOUT
  if (game?.status === "active" && currentQuestion) {
    return (
      <PageLayout gameCode={gameCode} timer={timer} variant="game">
        {/* Left Team Panel */}
        <div className="w-48 flex-shrink-0">
          <TeamPanel
            team={game.teams[0]}
            teamIndex={0}
            isActive={game.teams[0]?.active}
          />
        </div>

        {/* Center Game Area */}
        <GameBoard
          game={game}
          currentBuzzer={currentBuzzer}
          answerTimeLeft={answerTimeLeft}
          onNextQuestion={handleNextQuestion}
          onClearBuzzer={handleClearBuzzer}
          isHost={true}
          variant="host"
          controlMessage={controlMessage}
        />

        {/* Right Team Panel */}
        <div className="w-48 flex-shrink-0">
          <TeamPanel
            team={game.teams[1]}
            teamIndex={1}
            isActive={game.teams[1]?.active}
          />
        </div>
      </PageLayout>
    );
  }

  // Results Screen
  if (game?.status === "finished") {
    return (
      <PageLayout gameCode={gameCode} timer={timer}>
        <GameResults
          teams={game.teams}
          onCreateNewGame={createGame}
          showCreateNewGame={true}
        />
      </PageLayout>
    );
  }

  // Fallback for any unexpected game state
  return (
    <PageLayout gameCode={gameCode}>
      <AnimatedCard>
        <div className="glass-card p-8 text-center">
          <p className="text-xl font-bold mb-4">Unexpected Game State</p>
          <p className="text-slate-400 mb-4">
            The game is in an unexpected state. Please refresh the page or
            create a new game.
          </p>
          <Link to={ROUTES.HOME}>
            <Button variant="primary">Back to Home</Button>
          </Link>
        </div>
      </AnimatedCard>
    </PageLayout>
  );
};

export default HostGamePage;
